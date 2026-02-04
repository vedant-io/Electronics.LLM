const mongoose = require('mongoose');

const CachedResponseSchema = new mongoose.Schema({
  requestHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true
  },
  requestPayload: {
    type: Object, // Store the original request body for debugging/verification
    required: true
  },
  responseData: {
    type: Object, // The cached JSON response
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Optional: expire after 24 hours (can be adjusted)
  }
});

module.exports = mongoose.model('CachedResponse', CachedResponseSchema);
