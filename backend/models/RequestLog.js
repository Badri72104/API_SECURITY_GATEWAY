const mongoose = require('mongoose');

const RequestLogSchema = new mongoose.Schema({
  apiKeyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  method:      String,
  path:        String,
  statusCode:  Number,
  latencyMs:   Number,
  ip:          String,
  blocked:     { type: Boolean, default: false },
  blockReason: String,
  timestamp:   { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('RequestLog', RequestLogSchema);