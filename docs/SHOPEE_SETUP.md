# Shopee API Setup Guide

## Overview

This system supports both **Test** and **Production** Shopee environments.

- **Test Environment**: For development and testing (https://partner.test-stable.shopeemobile.com)
- **Production Environment**: For live operations (https://partner.shopeemobile.com)

---

## Step 1: Register as Shopee Partner

### For Test Environment

1. Go to: https://partner.test-stable.shopeemobile.com
2. Create a test shop account
3. Register as a developer/partner
4. Create a test application

### For Production Environment

1. Go to: https://open.shopee.com
2. Register with your actual Shopee seller account
3. Apply for partner access
4. Create a production application

---

## Step 2: Get Your Credentials

After registration, you'll receive:

- **Partner ID**: Your unique partner identifier
- **Partner Key**: Secret key for signing requests
- **Shop ID**: Your shop's unique identifier
- **Merchant ID**: Your merchant identifier (optional)

---

## Step 3: Configure Environment Variables

### Test Environment Setup

Edit `.env` file:

```env
# Set environment to test
SHOPEE_ENV=test

# Add your test credentials
SHOPEE_TEST_PARTNER_ID=your_test_partner_id
SHOPEE_TEST_PARTNER_KEY=your_test_partner_key
SHOPEE_TEST_SHOP_ID=your_test_shop_id
SHOPEE_TEST_MERCHANT_ID=your_test_merchant_id
```

### Production Environment Setup

When ready for production:

```env
# Set environment to production
SHOPEE_ENV=production

# Add your production credentials
SHOPEE_PROD_PARTNER_ID=your_prod_partner_id
SHOPEE_PROD_PARTNER_KEY=your_prod_partner_key
SHOPEE_PROD_SHOP_ID=your_prod_shop_id
SHOPEE_PROD_MERCHANT_ID=your_prod_merchant_id
```

---

## Step 4: OAuth Authorization Flow

Shopee API v2 requires OAuth authorization:

### 1. Get Authorization URL

```bash
curl http://localhost:5000/api/shopee/auth/url
```

Response:
```json
{
  "success": true,
  "authUrl": "https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner?...",
  "message": "Redirect user to this URL to authorize"
}
```

### 2. Authorize Your Shop

1. Copy the `authUrl` from the response
2. Open it in a browser
3. Log in with your Shopee shop account
4. Grant permissions
5. You'll be redirected to: `http://localhost:5000/api/shopee/auth/callback?code=xxx&shop_id=xxx`

### 3. Access Token

The callback will return:

```json
{
  "success": true,
  "message": "Authorization successful!",
  "data": {
    "access_token": "454a63626d774979564c445979454968",
    "refresh_token": "56784d6b5a4a6a666d79744d71497477",
    "expire_in": 14394,
    "request_id":"e3e3e7f35056d9dc81779794c4ec4300",
    "merchant_id_list":[],
    "shop_id_list":[226318182],
    "supplier_id_list":[],
    "user_id_list":[7903773122],
    "error":"","message":""
    }
}
```

### 4. Store Tokens

**IMPORTANT**: In production, store these tokens securely in your database!

For testing, you can use them directly in API calls.

---

## Step 5: Test API Calls

### Test Connection

```bash
curl http://localhost:5000/api/shopee/test-connection
```

### Get Shop Info

```bash
curl -X POST http://localhost:5000/api/shopee/shop-info \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "454a63626d774979564c445979454968"}'
```

### Sync Products

```bash
curl -X POST http://localhost:5000/api/shopee/sync-products \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "454a63626d774979564c445979454968"}'
```

---

## Environment Switching

### Switch to Test

```env
SHOPEE_ENV=test
```

Then restart:
```bash
docker-compose restart backend
```

### Switch to Production

```env
SHOPEE_ENV=production
```

Then restart:
```bash
docker-compose restart backend
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shopee/environment` | GET | Get current environment info |
| `/api/shopee/test-connection` | GET | Test API credentials |
| `/api/shopee/auth/url` | GET | Get OAuth authorization URL |
| `/api/shopee/auth/callback` | GET | OAuth callback handler |
| `/api/shopee/shop-info` | POST | Get shop information (requires access token) |
| `/api/shopee/sync-products` | POST | Sync products from Shopee (requires access token) |
| `/api/shopee/update-stock/:id` | POST | Update stock in Shopee (requires access token) |
| `/api/shopee/webhook` | POST | Webhook handler for Shopee events |

---

## Troubleshooting

### "Credentials not configured"

- Check `.env` file has correct credentials
- Ensure environment matches (test vs production)
- Restart backend: `docker-compose restart backend`

### "Invalid signature"

- Verify Partner Key is correct
- Check system time is synchronized
- Ensure no extra spaces in credentials

### "Access token expired"

- Access tokens expire after 4 hours
- Use refresh token to get new access token
- Implement automatic token refresh in production

---

## Security Best Practices

1. **Never commit credentials** to git
2. **Use environment variables** for all sensitive data
3. **Store tokens encrypted** in database
4. **Implement token refresh** logic
5. **Use HTTPS** in production
6. **Validate webhook signatures**
7. **Rate limit** API calls

---

## Next Steps

1. ✅ Configure test environment
2. ✅ Test OAuth flow
3. ✅ Sync test products
4. ⏳ Implement token storage
5. ⏳ Add automatic token refresh
6. ⏳ Set up webhooks
7. ⏳ Move to production when ready
