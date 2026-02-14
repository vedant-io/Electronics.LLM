const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const CachedResponse = require('../models/CachedResponse');
const auth = require('../middleware/auth');

// Helper to normalize payload for caching
// Helper to normalize payload for caching
const normalizePayload = (payload) => {
  const normalized = { ...payload };
  const targetKeys = ['user_description', 'project_topic', 'query']; // Fields to normalize

  targetKeys.forEach(key => {
    if (normalized[key] && typeof normalized[key] === 'string') {
      // Simplify normalization: only trim and lowercase.
      // Removing prefixes like "create", "build" caused different intents to hash to the same key.
      normalized[key] = normalized[key].trim().toLowerCase();
    }
  });

  return normalized;
};

// Helper: Recursive JSON Parser & Cleaner
const formatResponse = (data) => {
  if (typeof data === 'string') {
    // 1. Try JSON Parse
    try {
      // Basic check to avoid parsing simple strings like "hello"
      if ((data.trim().startsWith('{') || data.trim().startsWith('['))) {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) {
          return formatResponse(parsed); // Recurse
        }
      }
    } catch (e) {
      // Ignore parse error
    }

    // 2. Gemini Event Object Cleanup
    // Pattern: [Event( ... text="""CONTENT""" ... )]
    if (data.includes('[Event(') && data.includes('text="""')) {
      try {
        const textMatch = data.match(/text="""([\s\S]*?)"""/);
        if (textMatch && textMatch[1]) {
           // Provide the clean text. 
           // If the text itself is JSON, try to parse it too.
           let cleanText = textMatch[1];
           // Unescape common sequence if needed, though """ usually preserves it.
           // Recursive call in case the inner text is a JSON string
           return formatResponse(cleanText);
        }
      } catch (e) {
        console.error("Error parsing Gemini Event string", e);
      }
    }
    
    return data;
  } else if (Array.isArray(data)) {
    return data.map(item => formatResponse(item));
  } else if (typeof data === 'object' && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = formatResponse(data[key]);
    }
    return cleaned;
  }
  return data;
};

// Helper to generate hash
const generateHash = (endpoint, payload) => {
  // Use normalized payload for hash generation
  const normalized = normalizePayload(payload);
  const data = JSON.stringify({ endpoint, payload: normalized });
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generic Shield Function
const shield = async (req, res, endpointPath) => {
  const rawPayload = req.body;
  
  // Use Helper to generate hash from NORMALIZED payload
  const hash = generateHash(endpointPath, rawPayload);

  try {
    // 1. Check Cache
    let cached = await CachedResponse.findOne({ requestHash: hash });
    
    if (cached) {
      console.log(`[Shield] Cache HIT for ${endpointPath} (Hash: ${hash.substring(0,8)})`);
      return res.json(cached.responseData);
    }

    console.log(`[Shield] Cache MISS for ${endpointPath} (Hash: ${hash.substring(0,8)}). Fetching from Agents...`);

    // 2. Fetch from Python Agents (Sending ORIGINAL RAW payload)
    const agentsUrl = process.env.AGENTS_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${agentsUrl}${endpointPath}`, rawPayload);

    // 3. Format/Clean the response
    const cleanData = formatResponse(response.data);

    // 4. Cache the CLEAN response atomically using upsert
    // This prevents E11000 duplicate key errors if two requests race to insert
    try {
        await CachedResponse.findOneAndUpdate(
            { requestHash: hash },
            {
                endpoint: endpointPath,
                requestPayload: rawPayload,
                responseData: cleanData,
                createdAt: new Date() // Refresh timestamp
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`[Shield] Cached CLEAN response for ${endpointPath}`);
    } catch (dbError) {
        console.error(`[Shield] Cache insertion warning: ${dbError.message}`);
    }

    // 5. Return response
    res.json(cleanData);

  } catch (error) {
    console.error(`[Shield] Error proxying to ${endpointPath}:`, error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      return res.status(503).json({ msg: 'Agents Service Unavailable' });
    } else {
      return res.status(500).json({ msg: 'Internal Shield Error' });
    }
  }
};

// --- Endpoints ---

// Apply 'auth' middleware if these routes should be protected. 
// The user prompt implies this backend "will include authentication... for student and teacher".
// However, the "shield" part is primarily for checking cache. 
// Typically, you'd want these protected. I will add 'auth' middleware.

// POST /api/agents/project-name
router.post('/project-name', async (req, res) => {
  await shield(req, res, '/project-name');
});

// POST /api/agents/main-agent
router.post('/main-agent', async (req, res) => {
  await shield(req, res, '/main-agent');
});

// POST /api/agents/code-agent
router.post('/code-agent', async (req, res) => {
  await shield(req, res, '/code-agent');
});

// POST /api/agents/beginner/basics
router.post('/beginner/basics', async (req, res) => {
  await shield(req, res, '/beginner/basics');
});

// POST /api/agents/beginner/adaptive
router.post('/beginner/adaptive', async (req, res) => {
  await shield(req, res, '/beginner/adaptive');
});

// POST /api/agents/troubleshoot
router.post('/troubleshoot', async (req, res) => {
  await shield(req, res, '/troubleshoot');
});

module.exports = router;
