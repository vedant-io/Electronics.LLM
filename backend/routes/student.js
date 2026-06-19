const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const validateObjectId = require("../middleware/validateObjectId");
const QuizResult = require("../models/QuizResult");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const Question = require("../models/Question");
const ModuleSession = require("../models/ModuleSession");
const User = require("../models/User");
const Faculty = require("../models/Faculty");
const ProctoringIncident = require("../models/ProctoringIncident");
const { sendAssignmentEmails } = require("../utils/mailer");

router.use(auth, roleAuth("student"));

// Helper: parse pagination params
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// --- Quiz Results ---

router.post(
  "/quiz-result",
  [
    body("topic", "Topic is required").notEmpty().trim(),
    body("score", "Score is required").isNumeric(),
    body("totalQuestions", "Total questions is required").isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { topic, score, totalQuestions, answers, tabSwitchCount } = req.body;
      const percentage = Math.round((score / totalQuestions) * 100);

      const quizResult = new QuizResult({
        student: req.user.id,
        topic,
        score,
        totalQuestions,
        percentage,
        answers: answers || [],
        tabSwitchCount: tabSwitchCount || 0,
      });

      await quizResult.save();
      res.status(201).json(quizResult);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

router.get("/quiz-results", async (req, res) => {
  try {
    const { limit, skip, page } = paginate(req.query);
    const [results, total] = await Promise.all([
      QuizResult.find({ student: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuizResult.countDocuments({ student: req.user.id }),
    ]);
    res.json({ results, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// --- Projects ---

router.post(
  "/project",
  [body("title", "Title is required").notEmpty().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, topic, components, notes, guide } = req.body;
      const project = new Project({
        student: req.user.id,
        title,
        description: description || "",
        topic: topic || "",
        components: components || [],
        notes: notes || "",
        guide: guide || null,
      });

      await project.save();

      // If a guide was selected at creation time, dispatch the assignment emails
      if (guide) {
        try {
          const studentUser = await User.findById(req.user.id);
          const facultyUser = await Faculty.findById(guide);
          if (studentUser && facultyUser) {
            await sendAssignmentEmails(studentUser, facultyUser, project.title);
          }
        } catch (err) {
          console.error("Failed to send initial assignment emails", err);
        }
      }

      res.status(201).json(project);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

router.put("/project/:id", validateObjectId("id"), async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      student: req.user.id,
    });
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const previousGuide = project.guide ? project.guide.toString() : null;

    const allowedFields = ["title", "description", "topic", "status", "components", "notes", "guide"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    await project.save();

    // Check if a NEW guide was assigned
    if (project.guide && project.guide.toString() !== previousGuide) {
      try {
        const studentUser = await User.findById(req.user.id);
        const facultyUser = await Faculty.findById(project.guide);
        if (studentUser && facultyUser) {
          await sendAssignmentEmails(studentUser, facultyUser, project.title);
        }
      } catch (err) {
        console.error("Failed to send assignment emails", err);
      }
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/projects", async (req, res) => {
  try {
    const { limit, skip, page } = paginate(req.query);
    const [projects, total] = await Promise.all([
      Project.find({ student: req.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments({ student: req.user.id }),
    ]);
    res.json({ projects, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/projects/:id/feedback", validateObjectId("id"), async (req, res) => {
  try {
    const projectExists = await Project.exists({
      _id: req.params.id,
      student: req.user.id,
    });
    if (!projectExists) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const feedback = await Feedback.find({ project: req.params.id })
      .populate("teacher", "username")
      .sort({ createdAt: -1 })
      .lean();
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// --- Questions ---

router.post(
  "/question",
  [
    body("topic", "Topic is required").notEmpty().trim(),
    body("questionText", "Question text is required").notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { topic, questionText } = req.body;
      const question = new Question({
        student: req.user.id,
        topic,
        questionText,
      });

      await question.save();
      res.status(201).json(question);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

router.get("/questions", async (req, res) => {
  try {
    const { limit, skip, page } = paginate(req.query);
    const filter = { student: req.user.id };
    if (req.query.status && ["pending", "answered"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("teacher", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(filter),
    ]);
    res.json({ questions, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── Module Sessions ────────────────────────────────────────

router.post("/module-session/start", [
  body("module", "module name is required").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const session = await ModuleSession.create({
      student: req.user.id,
      module: req.body.module,
      topic: req.body.topic || "",
    });
    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/module-session/end", [
  body("sessionId", "sessionId is required").notEmpty(),
], async (req, res) => {
  try {
    const session = await ModuleSession.findOne({
      _id: req.body.sessionId,
      student: req.user.id,
    });
    if (!session) return res.status(404).json({ msg: "Session not found" });
    if (session.endedAt) return res.json(session); // already closed
    session.endedAt = new Date();
    session.durationSeconds = Math.round((session.endedAt - session.startedAt) / 1000);
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/module-sessions", async (req, res) => {
  try {
    const sessions = await ModuleSession.find({ student: req.user.id })
      .sort({ startedAt: -1 }).limit(100).lean();
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── Proctoring ────────────────────────────────────────

router.post("/proctoring-incident", [
  body("quizTopic", "topic is required").notEmpty(),
  body("type", "type is required").notEmpty(),
  body("severity", "severity is required").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const incident = await ProctoringIncident.create({
      student: req.user.id,
      quizTopic: req.body.quizTopic,
      type: req.body.type,
      severity: req.body.severity,
      metadata: req.body.metadata || {}
    });

    // Populate student info for the teacher alert
    const populated = await incident.populate("student", "username");
    
    // Broadcast to dashboard
    const io = req.app.get("io");
    if (io) {
      io.emit("proctoring:alert", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
