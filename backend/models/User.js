const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    default: "student",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isMock: {
    type: Boolean,
    default: false,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null,
  },
  avatar: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("User", UserSchema);
