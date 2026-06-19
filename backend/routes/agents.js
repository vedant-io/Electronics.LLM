const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");
const CachedResponse = require("../models/CachedResponse");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

// Reusable axios instance with timeout + keepAlive
const agentClient = axios.create({
  baseURL: process.env.AGENTS_API_URL || "http://localhost:3040",
  timeout: 120000, // 2 min — AI agents can be slow
  headers: { "Content-Type": "application/json" },
});

// L1 in-memory cache
const memoryCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  maxKeys: 500,
  useClones: false, // Performance: skip deep clone on get (data is read-only)
});

const ENDPOINT_TTL = {
  "/project-name": 1800,
  "/main-agent": 900,
  "/code-agent": 900,
  "/beginner/basics": 3600,
  "/beginner/adaptive": 600,
  "/troubleshoot": 300,
};

const getEndpointTTL = (endpoint) => ENDPOINT_TTL[endpoint] || 600;

let cacheStats = { l1Hits: 0, l2Hits: 0, misses: 0 };

const normalizePayload = (payload) => {
  const normalized = { ...payload };
  const targetKeys = ["user_description", "project_topic", "query"];
  for (const key of targetKeys) {
    if (normalized[key] && typeof normalized[key] === "string") {
      normalized[key] = normalized[key].trim().toLowerCase();
    }
  }
  return normalized;
};

// Depth-limited recursive JSON cleaner
const formatResponse = (data, depth = 0) => {
  if (depth > 20) return data;

  if (typeof data === "string") {
    try {
      if (data.trim().startsWith("{") || data.trim().startsWith("[")) {
        const parsed = JSON.parse(data);
        if (typeof parsed === "object" && parsed !== null) {
          return formatResponse(parsed, depth + 1);
        }
      }
    } catch (e) { /* not JSON */ }

    if (data.includes("[Event(") && data.includes('text="""')) {
      const textMatch = data.match(/text="""([\s\S]*?)"""/);
      if (textMatch && textMatch[1]) {
        return formatResponse(textMatch[1], depth + 1);
      }
    }
    return data;
  } else if (Array.isArray(data)) {
    return data.map((item) => formatResponse(item, depth + 1));
  } else if (typeof data === "object" && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = formatResponse(data[key], depth + 1);
    }
    return cleaned;
  }
  return data;
};

const generateHash = (endpoint, payload) => {
  const normalized = normalizePayload(payload);
  return crypto.createHash("sha256")
    .update(JSON.stringify({ endpoint, payload: normalized }))
    .digest("hex");
};

// Two-tier shield: L1 (memory) → L2 (MongoDB) → upstream
const shield = async (req, res, endpointPath) => {
  const rawPayload = req.body;
  const hash = generateHash(endpointPath, rawPayload);
  const ttl = getEndpointTTL(endpointPath);

  try {
    // L1 check
    const memoryCached = memoryCache.get(hash);
    if (memoryCached) {
      cacheStats.l1Hits++;
      return res.json(memoryCached);
    }

    // L2 check — use lean() for faster reads, separate update for hit tracking
    const dbCached = await CachedResponse.findOne({ requestHash: hash })
      .select("responseData hitCount")
      .lean();

    if (dbCached) {
      cacheStats.l2Hits++;
      memoryCache.set(hash, dbCached.responseData, ttl);
      // Fire-and-forget hit count increment (non-blocking)
      CachedResponse.updateOne(
        { requestHash: hash },
        { $inc: { hitCount: 1 }, lastAccessedAt: new Date() }
      ).exec();
      return res.json(dbCached.responseData);
    }

    cacheStats.misses++;

    // Fetch from upstream agents
    const response = await agentClient.post(endpointPath, rawPayload);
    const cleanData = formatResponse(response.data);

    // Store L1
    memoryCache.set(hash, cleanData, ttl);

    // Store L2 (fire-and-forget upsert)
    CachedResponse.findOneAndUpdate(
      { requestHash: hash },
      {
        endpoint: endpointPath,
        requestPayload: rawPayload,
        responseData: cleanData,
        hitCount: 1,
        lastAccessedAt: new Date(),
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec().catch((err) => console.error(`[Shield] Cache store warning: ${err.message}`));

    res.json(cleanData);
  } catch (error) {
    console.error(`[Shield] Error proxying to ${endpointPath}:`, error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    } else if (error.code === "ECONNABORTED") {
      return res.status(504).json({ msg: "Agent request timed out" });
    } else if (error.request) {
      return res.status(503).json({ msg: "Agents Service Unavailable" });
    }
    return res.status(500).json({ msg: "Internal Shield Error" });
  }
};

// --- Agent endpoints (protected with auth) ---

router.post("/project-name", auth, async (req, res) => {
  await shield(req, res, "/project-name");
});

router.post("/main-agent", auth, async (req, res) => {
  await shield(req, res, "/main-agent");
});

router.post("/code-agent", auth, async (req, res) => {
  await shield(req, res, "/code-agent");
});

router.post("/beginner/basics", auth, async (req, res) => {
  await shield(req, res, "/beginner/basics");
});

router.post("/beginner/adaptive", auth, async (req, res) => {
  await shield(req, res, "/beginner/adaptive");
});

router.post("/troubleshoot", auth, async (req, res) => {
  await shield(req, res, "/troubleshoot");
});

// --- Cache management (teacher-only for destructive ops) ---

router.get("/cache/stats", auth, (req, res) => {
  const memStats = memoryCache.getStats();
  res.json({
    l1: { hits: cacheStats.l1Hits, keys: memoryCache.keys().length, ...memStats },
    l2: { hits: cacheStats.l2Hits },
    misses: cacheStats.misses,
    totalRequests: cacheStats.l1Hits + cacheStats.l2Hits + cacheStats.misses,
  });
});

router.delete("/cache/flush", auth, roleAuth("teacher"), async (req, res) => {
  memoryCache.flushAll();
  await CachedResponse.deleteMany({});
  cacheStats = { l1Hits: 0, l2Hits: 0, misses: 0 };
  res.json({ msg: "All caches flushed" });
});

router.delete("/cache/endpoint/:endpointName", auth, roleAuth("teacher"), async (req, res) => {
  const endpoint = "/" + req.params.endpointName;
  const hashes = await CachedResponse.find({ endpoint }).select("requestHash").lean();
  hashes.forEach((entry) => memoryCache.del(entry.requestHash));
  await CachedResponse.deleteMany({ endpoint });
  res.json({ msg: `Cache flushed for ${endpoint}`, entriesRemoved: hashes.length });
});

// --- Analytics proxy (no caching) ---

router.get("/analytics/tokens", auth, async (req, res) => {
  try {
    const response = await agentClient.get("/analytics/tokens");
    res.json(response.data);
  } catch (error) {
    console.error("[Analytics] Error fetching token analytics:", error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(503).json({ msg: "Agents Service Unavailable" });
  }
});

router.post("/analytics/tokens/reset", auth, roleAuth("teacher"), async (req, res) => {
  try {
    const response = await agentClient.post("/analytics/tokens/reset");
    res.json(response.data);
  } catch (error) {
    console.error("[Analytics] Error resetting token analytics:", error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(503).json({ msg: "Agents Service Unavailable" });
  }
});

module.exports = router;
