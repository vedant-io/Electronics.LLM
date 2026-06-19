const mongoose = require("mongoose");

const ProctoringIncidentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quizTopic: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["tab_switch", "fullscreen_exit", "copy_paste", "camera_detection", "blur", "keyboard_shortcut"],
    required: true,
  },
  severity: {
    type: String,
    enum: ["warning", "final_warning", "critical"],
    default: "warning",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Object, // for screenshot data, count, etc.
  },
});

ProctoringIncidentSchema.index({ student: 1, timestamp: -1 });

module.exports = mongoose.model("ProctoringIncident", ProctoringIncidentSchema);
