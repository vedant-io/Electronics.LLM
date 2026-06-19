const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
const tokenBlacklist = require("../middleware/tokenBlacklist");
const { passport, issueJWT } = require("../config/passport");

// ── OAuth routes ───────────────────────────────────────────

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3060";

// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = issueJWT(req.user);
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// GitHub
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = issueJWT(req.user);
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
  }
);


// @route   POST api/auth/register
// @desc    Register user (signup)
// @access  Public
router.post(
  "/register",
  [
    body("username", "Username is required (min 3 chars)").isLength({ min: 3 }),
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
    body("role").optional().isIn(["student", "teacher"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    try {
      let existing = await User.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        const field = existing.username === username ? "Username" : "Email";
        return res.status(400).json({ msg: `${field} already exists` });
      }

      const user = new User({
        username,
        email,
        password,
        role: role || "student",
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = { user: { id: user.id, role: user.role, faculty: user.faculty } };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "5d",
      });
      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    body("username", "Username is required").notEmpty(),
    body("password", "Password is required").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const payload = { user: { id: user.id, role: user.role, faculty: user.faculty } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "5d",
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// @route   POST api/auth/logout
// @desc    Logout user (blacklist token)
// @access  Private
router.post("/logout", auth, (req, res) => {
  const token = req.header("x-auth-token");
  tokenBlacklist.add(token);
  res.json({ msg: "Logged out successfully" });
});

// @route   PUT api/auth/password
// @desc    Change password
// @access  Private
router.put("/password", auth, [
  body("currentPassword", "Current password is required").notEmpty(),
  body("newPassword", "New password must be at least 6 characters").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.newPassword, salt);
    await user.save();
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET api/auth/me
// @desc    Get current authenticated user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET api/auth/user  (kept for backward compatibility)
// @desc    Get user data
// @access  Private
router.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
