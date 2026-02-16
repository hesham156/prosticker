# Webhook Integration Guide

## Setup Instructions

### 1. Install Dependencies
Already done! ✅

### 2. Configure Environment Variables

#### Get Firebase Service Account Key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file

#### Add to Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
WEBHOOK_API_KEY = your-secret-api-key-here
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_CLIENT_EMAIL = your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** For `FIREBASE_PRIVATE_KEY`, copy the entire private key from the JSON file including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts.

### 3. Deploy to Vercel

```bash
# Add vercel.json (already created)
# Push to GitHub
git add .
git commit -m "Add webhook endpoint"
git push

# Vercel will auto-deploy
```

---

## Webhook URL

After deployment, your webhook URL will be:
```
https://your-app-name.vercel.app/api/webhook
```

---

## Make.com Configuration

### HTTP Request Module Setup:

**URL:**
```
https://your-app-name.vercel.app/api/webhook?apiKey=YOUR_API_KEY
```

**Method:** POST

**Headers:**
```
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

**Body (JSON):**
```json
{
  "order_id": "{{order.id}}",
  "product_type": "ribbons",
  "quantity": {{order.quantity}},
  "delivery_date": "{{order.delivery_date}}",
  "notes": "{{order.notes}}",
  "product_config": {
    "ribbon_type": "satin",
    "ribbon_size": "wide",
    "ribbon_color": "white"
  }
}
```

---

## Testing

### Test with cURL:

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "order_id": "TEST-001",
    "product_type": "ribbons",
    "quantity": 50,
    "delivery_date": "2026-03-15",
    "notes": "Test order from webhook"
  }'
```

### Expected Response:

**Success (200):**
```json
{
  "success": true,
  "orderId": "abc123xyz",
  "orderNumber": "WEB-TEST-001",
  "message": "Order created successfully"
}
```

**Error (400):**
```json
{
  "error": "Missing required fields",
  "missing": ["quantity"],
  "received": ["order_id", "product_type", "delivery_date"]
}
```

**Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

---

## Webhook Data Format

### Required Fields:
- `product_type` - Product type ID (e.g., "ribbons", "belts")
- `quantity` - Number (integer)
- `delivery_date` - Date string (YYYY-MM-DD)

### Optional Fields:
- `order_id` - External order ID
- `notes` - Order notes
- `product_config` - Product configuration object
- `designer_id` - Assigned designer UID
- `designer_name` - Assigned designer name
- `custom_fields` - Array of custom fields

---

## Monitoring

### View Webhook Logs in Firestore:
Collection: `webhook_logs`

Each log contains:
- `orderId` - Created order ID
- `orderNumber` - Order number
- `webhookData` - Original webhook data
- `timestamp` - When webhook was received
- `status` - "success" or "error"
- `error` - Error message (if failed)

### View in Sales Dashboard:
All webhook-created orders will appear in the Sales Dashboard with:
- Order number starting with "WEB-"
- Sales notes: "[Auto-created from online store]"
- Created by: "webhook-system"

---

## Security

✅ API Key authentication
✅ HTTPS only (automatic with Vercel)
✅ Input validation
✅ Error logging
✅ CORS configured

---

## Next Steps

1. ✅ Create webhook endpoint
2. ⏳ Add environment variables to Vercel
3. ⏳ Deploy to Vercel
4. ⏳ Test with Make.com
5. ⏳ Monitor webhook logs
