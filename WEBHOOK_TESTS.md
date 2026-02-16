# Webhook Test Examples

## Test 1: Basic Order (Ribbons)

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
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

## Test 2: Belts Order

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "order_id": "SHOP-002",
    "product_type": "belts",
    "quantity": 50,
    "delivery_date": "2026-03-20",
    "notes": "Corporate event - branded belts",
    "product_config": {
      "belt_type": "woven",
      "paper_size": "a4",
      "length": "30",
      "width": "5"
    }
  }'
```

## Test 3: With Designer Assignment

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "order_id": "SHOP-003",
    "product_type": "ribbons",
    "quantity": 200,
    "delivery_date": "2026-03-25",
    "notes": "VIP client - priority order",
    "designer_id": "designer-uid-123",
    "designer_name": "Ahmed Hassan"
  }'
```

## Test 4: Error - Missing Required Field

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "order_id": "SHOP-004",
    "product_type": "ribbons",
    "delivery_date": "2026-03-30"
  }'
```

Expected: 400 Bad Request - Missing quantity

## Test 5: Error - Invalid API Key

```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: WRONG_KEY" \
  -d '{
    "order_id": "SHOP-005",
    "product_type": "ribbons",
    "quantity": 50,
    "delivery_date": "2026-04-01"
  }'
```

Expected: 401 Unauthorized
