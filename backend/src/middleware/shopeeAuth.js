const ShopeeToken = require('../models/ShopeeToken');
const shopeeService = require('../services/shopeeService');

module.exports = async function shopeeAuth(req, res, next) {
  const env    = shopeeService.environment; // 'test' or 'production'
  const shopId = parseInt(process.env[`SHOPEE_${env.toUpperCase()}_SHOP_ID`]);
  const token  = await ShopeeToken.findOne({ shopId });

  if (!token || !token[env]?.accessToken) {
    return res.status(401).json({ 
      success: false, 
      error: `No ${env} token found. Re-authorize via /api/shopee/auth/url` 
    });
  }

  if (token.isExpired(env)) {
    const refreshed = await shopeeService.refreshAccessToken(token[env].refreshToken, shopId);

    await ShopeeToken.findOneAndUpdate(
      { shopId },
      {
        [`${env}.accessToken`]:  refreshed.access_token,
        [`${env}.refreshToken`]: refreshed.refresh_token,
        [`${env}.expiresAt`]:    new Date(Date.now() + refreshed.expire_in * 1000),
        [`${env}.updatedAt`]:    new Date()
      }
    );

    req.accessToken = refreshed.access_token;
  } else {
    req.accessToken = token[env].accessToken;
  }

  next();
};