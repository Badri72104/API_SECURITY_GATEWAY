const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const ApiKeySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  keyHash:     { type: String, required: true },
  prefix:      { type: String, required: true },
  targetUrl:   { type: String, required: true },
  rateLimit:   { type: Number, default: 100 },
  isActive:    { type: Boolean, default: true },
  ipWhitelist: { type: [String], default: [] },
  usageCount:  { type: Number, default: 0 },
  usageLimit:  { type: Number, default: 10000 },
  createdAt:   { type: Date, default: Date.now },
});

ApiKeySchema.pre('save', async function () {
  this.keyHash = await bcrypt.hash(this.keyHash, 12);
});

ApiKeySchema.methods.verifySecret = function (raw) {
  return bcrypt.compare(raw, this.keyHash);
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);