# Webhook Test Script

## Test 1: Basic Ribbons Order

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "SHOP-001",
    "product_type": "ribbons",
    "quantity": 100,
    "delivery_date": "2026-03-15",
    "notes": "Wedding order - white satin ribbons",
    "product_config": {
      "ribbon_type": "satin",
      "ribbon_size": "wide",
      "ribbon_color": "white"
    }
  }'
```

## Test 2: Using PowerShell (Windows)

```powershell
$body = @{
    order_id = "SHOP-002"
    product_type = "ribbons"
    quantity = 50
    delivery_date = "2026-03-20"
    notes = "Test order from PowerShell"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Test 3: Make.com Configuration

**Webhook URL:**
```
https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456
```

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "order_id": "{{order.id}}",
  "product_type": "ribbons",
  "quantity": {{order.quantity}},
  "delivery_date": "{{order.delivery_date}}",
  "notes": "{{order.notes}}"
}
```

## Expected Success Response:

```json
{
  "success": true,
  "orderId": "abc123xyz",
  "orderNumber": "WEB-SHOP-001",
  "message": "Order created successfully"
}
```

## Check Order in Dashboard:

After successful webhook, check:
1. Sales Dashboard → should see order with number "WEB-SHOP-001"
2. Status: "pending-design"
3. Sales Notes: includes "[Auto-created from online store]"
