const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3050";

const issueJWT = (user) =>
  jwt.sign({ user: { id: user.id, role: user.role, faculty: user.faculty } }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });

/* ── Google ── */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email from Google"));

          let user = await User.findOne({ email });
          if (!user) {
            const username =
              profile.displayName.replace(/\s+/g, "").toLowerCase() +
              Math.floor(Math.random() * 1000);
            user = await User.create({
              username,
              email,
              password: require("crypto").randomBytes(32).toString("hex"),
              role: "student",
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

/* ── GitHub ── */
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (
            profile.emails?.[0]?.value || `${profile.username}@github.local`
          ).toLowerCase();

          let user = await User.findOne({ email });
          if (!user) {
            const username =
              (profile.username || "ghuser") + Math.floor(Math.random() * 1000);
            user = await User.create({
              username,
              email,
              password: require("crypto").randomBytes(32).toString("hex"),
              role: "student",
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = { passport, issueJWT };
