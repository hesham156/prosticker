# Salla Webhook Test Examples

## Test 1: Order Created Event (Valid Order)

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "merchant": 123456789,
    "created_at": "2026-02-17 09:00:00",
    "data": {
      "id": 5001,
      "reference_id": 1234567,
      "draft": false,
      "date": {
        "date": "2026-02-17 09:00:00"
      },
      "status": {
        "name": "Under Review",
        "slug": "under-review"
      },
      "payment_method": "Credit Card",
      "currency": "SAR",
      "amounts": {
        "total": 350.50
      },
      "customer": {
        "first_name": "أحمد",
        "last_name": "محمد",
        "mobile": "+966501234567",
        "email": "ahmed@example.com"
      },
      "items": [
        {
          "name": "Custom Ribbon - White Satin",
          "sku": "RIBBON-001",
          "quantity": 100,
          "price": 3.50
        }
      ]
    }
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "orderId": "...",
  "orderNumber": "SALLA-1234567",
  "message": "Order created successfully",
  "source": "salla"
}
```

**Order Details:**
- Product Type: `ribbons` (extracted from "Ribbon" in item name)
- Delivery Date: 2026-02-24 (order date + 7 days)
- Quantity: 100

---

## Test 2: Order with Multiple Items

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "merchant": 123456789,
    "created_at": "2026-02-17 10:00:00",
    "data": {
      "id": 5002,
      "reference_id": 1234568,
      "draft": false,
      "date": {
        "date": "2026-02-17 10:00:00"
      },
      "status": {
        "name": "Completed",
        "slug": "completed"
      },
      "payment_method": "Bank Transfer",
      "currency": "SAR",
      "amounts": {
        "total": 750.00
      },
      "customer": {
        "first_name": "سارة",
        "last_name": "علي",
        "mobile": "+966502345678",
        "email": "sara@example.com"
      },
      "items": [
        {
          "name": "حزام مخصص - أسود",
          "sku": "BELT-002",
          "quantity": 50,
          "price": 10.00
        },
        {
          "name": "حزام مخصص - أبيض",
          "sku": "BELT-003",
          "quantity": 30,
          "price": 8.50
        }
      ]
    }
  }'
```

**Expected Result:**
- Product Type: `belts` (extracted from "حزام" in item name)
- Total Quantity: 80 (50 + 30)
- Items stored in `productConfig.items`

---

## Test 3: Draft Order (Should Not Create Order)

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "merchant": 123456789,
    "created_at": "2026-02-17 11:00:00",
    "data": {
      "id": 5003,
      "reference_id": 1234569,
      "draft": true,
      "date": {
        "date": "2026-02-17 11:00:00"
      },
      "status": {
        "name": "Draft",
        "slug": "draft"
      },
      "customer": {
        "first_name": "خالد",
        "last_name": "حسن"
      },
      "items": [
        {
          "name": "Test Product",
          "quantity": 10
        }
      ]
    }
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Event logged but not processed",
  "reason": "Order is draft (status: Draft)"
}
```

---

## Test 4: Order Status Updated (Confirmed)

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.status.updated",
    "merchant": 123456789,
    "created_at": "2026-02-17 12:00:00",
    "data": {
      "id": 5004,
      "reference_id": 1234570,
      "draft": false,
      "date": {
        "date": "2026-02-17 12:00:00"
      },
      "status": {
        "name": "In Progress",
        "slug": "in-progress"
      },
      "payment_method": "Cash on Delivery",
      "currency": "SAR",
      "amounts": {
        "total": 150.00
      },
      "customer": {
        "first_name": "فاطمة",
        "last_name": "أحمد",
        "mobile": "+966503456789"
      },
      "items": [
        {
          "name": "Custom Sticker Pack",
          "sku": "STICKER-100",
          "quantity": 500,
          "price": 0.30
        }
      ]
    }
  }'
```

**Expected Result:**
- Product Type: `stickers` (extracted from "Sticker" in item name)
- Event: `order.status.updated`

---

## Test 5: Custom Product (No Keyword Match)

```bash
curl -X POST "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "merchant": 123456789,
    "created_at": "2026-02-17 13:00:00",
    "data": {
      "id": 5005,
      "reference_id": 1234571,
      "draft": false,
      "date": {
        "date": "2026-02-17 13:00:00"
      },
      "status": {
        "name": "Under Review",
        "slug": "under-review"
      },
      "payment_method": "Credit Card",
      "currency": "SAR",
      "amounts": {
        "total": 500.00
      },
      "customer": {
        "first_name": "عمر",
        "last_name": "خالد",
        "email": "omar@example.com"
      },
      "items": [
        {
          "name": "طباعة مخصصة - تصميم خاص",
          "sku": "CUSTOM-999",
          "quantity": 25,
          "price": 20.00
        }
      ]
    }
  }'
```

**Expected Result:**
- Product Type: `custom` (default - no keyword match)

---

## Test 6: PowerShell Test (Windows)

```powershell
$body = @{
    event = "order.created"
    merchant = 123456789
    created_at = "2026-02-17 14:00:00"
    data = @{
        id = 5006
        reference_id = 1234572
        draft = $false
        date = @{
            date = "2026-02-17 14:00:00"
        }
        status = @{
            name = "Completed"
            slug = "completed"
        }
        payment_method = "Credit Card"
        currency = "SAR"
        amounts = @{
            total = 200.50
        }
        customer = @{
            first_name = "محمد"
            last_name = "عبدالله"
            mobile = "+966504567890"
        }
        items = @(
            @{
                name = "Ribbon Bundle - Red & Gold"
                sku = "RIBBON-BUNDLE-001"
                quantity = 150
                price = 1.34
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "https://prosticker.vercel.app/api/webhook?apiKey=sk_live_abc123xyz456" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

---

## Expected Webhook Log Structure in Firebase

```json
{
  "source": "salla",
  "event": "order.created",
  "merchant": 123456789,
  "orderId": 5001,
  "referenceId": 1234567,
  "shouldProcess": true,
  "reason": "Valid order",
  "timestamp": "...",
  "rawData": { /* full webhook payload */ }
}
```

## Expected Order Structure in Firebase

```json
{
  "orderNumber": "SALLA-1234567",
  "productType": "ribbons",
  "productConfig": {
    "source": "salla",
    "sallaOrderId": 5001,
    "items": [
      {
        "name": "Custom Ribbon - White Satin",
        "sku": "RIBBON-001",
        "quantity": 100,
        "price": 3.50
      }
    ]
  },
  "quantity": 100,
  "deliveryDate": "2026-02-24",
  "salesNotes": "Customer: أحمد محمد\nPhone: +966501234567\n...",
  "status": "pending-design",
  "createdBy": "salla-webhook",
  "customFields": [
    { "label": "Salla Order ID", "value": "5001" },
    { "label": "Salla Reference ID", "value": "1234567" },
    { "label": "Order Total", "value": "350.50 SAR" }
  ]
}
```
