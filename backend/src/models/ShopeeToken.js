const mongoose = require('mongoose');

const tokenDataSchema = new mongoose.Schema({
  accessToken:  { type: String, default: null },
  refreshToken: { type: String, default: null },
  expiresAt:    { type: Date,   default: null },
  updatedAt:    { type: Date,   default: null }
}, { _id: false });

const shopeeTokenSchema = new mongoose.Schema({
  shopId: { type: Number, required: true, unique: true },
  test:       { type: tokenDataSchema, default: () => ({}) },
  production: { type: tokenDataSchema, default: () => ({}) }
});

shopeeTokenSchema.methods.isExpired = function (env = 'test') {
  const expiresAt = this[env]?.expiresAt;
  if (!expiresAt) return true;
  return expiresAt <= new Date(Date.now() + 5 * 60 * 1000);
};

module.exports = mongoose.model('ShopeeToken', shopeeTokenSchema);