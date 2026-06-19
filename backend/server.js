require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server: SocketIO } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const { passport } = require("./config/passport");
const Faculty = require("./models/Faculty");
const Project = require("./models/Project");

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────
const io = new SocketIO(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:3060", methods: ["GET", "POST"] },
});

// Store active student sessions: { socketId → { studentId, username, module, topic } }
const activeStudents = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Send current state to new client immediately
  socket.emit("students:updated", Array.from(activeStudents.values()));

  socket.on("student:active", (data) => {
    activeStudents.set(socket.id, data);
    io.emit("students:updated", Array.from(activeStudents.values()));
  });

  socket.on("student:inactive", () => {
    activeStudents.delete(socket.id);
    io.emit("students:updated", Array.from(activeStudents.values()));
  });

  socket.on("disconnect", () => {
    activeStudents.delete(socket.id);
    io.emit("students:updated", Array.from(activeStudents.values()));
  });
});

// Make io accessible to routes
app.set("io", io);

// ── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-auth-token"],
}));
app.use(session({
  secret: process.env.SESSION_SECRET || "session_secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { msg: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── DB Connection ──────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected...");
    await seedFaculty();
    await injectMockLiveStudents();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const injectMockLiveStudents = async () => {
  const faculties = await Faculty.find({});
  for (const f of faculties) {
    const project = await Project.findOne({ guide: f._id }).populate("student");
    if (project && project.student) {
      // Add fake socket ID entries to activeStudents
      const fakeSocketId = `mock-socket-${f._id}-${project.student._id}`;
      activeStudents.set(fakeSocketId, {
        studentId: project.student._id,
        username: project.student.username,
        module: "Basics of Electronics",
        topic: "Serial Monitor",
        isMock: true
      });
    }
  }
  console.log(`Injected ${activeStudents.size} mock live students ✓`);
};

// ── Faculty seed ───────────────────────────────────────────
const seedFaculty = async () => {
  const count = await Faculty.countDocuments();
  if (count > 0) return; // already seeded

  const faculties = [
    { name: "Dr. Preeti Hemnani",      title: "Dr.",  gender: "Female" },
    { name: "Dr. Swati Rane",          title: "Dr.",  gender: "Female" },
    { name: "Prof. Biju Balkrishnan",  title: "Prof.", gender: "Male"  },
    { name: "Prof. Shyamala Mathi",    title: "Prof.", gender: "Female" },
    { name: "Prof. Priyanka Kadam",    title: "Prof.", gender: "Female" },
    { name: "Dr. Sonal Hutke",         title: "Dr.",  gender: "Female" },
    { name: "Prof. Vaishali Mangrulkar", title: "Prof.", gender: "Female" },
    { name: "Prof. Vandana Sawant",    title: "Prof.", gender: "Female" },
    { name: "Prof. Pratibha Joshi",    title: "Prof.", gender: "Female" },
    { name: "Prof. Pranavi Nikam",     title: "Prof.", gender: "Female" },
  ];
  await Faculty.insertMany(faculties);
  console.log("Faculty seeded ✓");
};

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth",    authLimiter, require("./routes/auth"));
app.use("/api/agents",  require("./routes/agents"));
app.use("/api/student", require("./routes/student"));
app.use("/api/teacher", require("./routes/teacher"));
app.use("/api/faculty", require("./routes/faculty"));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// Socket active-students snapshot for teachers (REST fallback)
const auth = require("./middleware/auth");
const User = require("./models/User");
app.get("/api/live/students", auth, async (req, res) => {
  const students = Array.from(activeStudents.values());
  if (req.user.role !== 'teacher') return res.json(students);
  
  if (!req.user.faculty) {
    const user = await User.findById(req.user.id).select("faculty");
    if (user) req.user.faculty = user.faculty;
  }
  
  const guideFilter = req.user.faculty ? { guide: req.user.faculty } : {};
  const guideProjects = await Project.find(guideFilter).distinct("student");
  const guideStudentIds = guideProjects.map(id => id.toString());
  
  const filtered = students.filter(s => guideStudentIds.includes(s.studentId?.toString()));
  res.json(filtered);
});

app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3050;

const startServer = async () => {
  await connectDB();
  const server = httpServer.listen(PORT, () =>
    console.log(`Server started on port ${PORT}`)
  );

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();

