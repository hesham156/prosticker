# Vercel Environment Variables Configuration

## Copy these values to Vercel Dashboard:

### 1. WEBHOOK_API_KEY
```
sk_live_abc123xyz456
```
(You can change this to any secret key you want)

---

### 2. FIREBASE_PROJECT_ID
```
aqar-b7d60
```

---

### 3. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@aqar-b7d60.iam.gserviceaccount.com
```

---

### 4. FIREBASE_PRIVATE_KEY

**Option 1: With \n (recommended for Vercel):**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZ73crglVkLuuO\nw45HDRjsduoH4WmcLv8FXBW1T/ttsvQFh3v6MJyp6SMUr+vpc3QyQWu5NauJ9Nim\nLOAhgVekis3MC48BjGGQjPdJdSMzKYLklvwdrlcyefyIGWk6Ekjjf6xvZhZlaNyM\nt5izgLNr7GMEJTBwIBNbrNKlX2VL4mGLD00sI5BopshU8r09+FkR6s5gXOqWYIze\nDJq4oFXNVUDjTF90RES8OOyBVN7vxFPUDD52KzA7ZPLH/+Wkcr2TDkSO1jnX4+7P\ntjNRYBBBoz8xY5lCqpEte1AD7DANqn/gSkAq+9y96UfIOOgA3+Xe/W9O1CJXov0D\n7Fh10xWJAgMBAAECggEAEuh52GaIbha8DTjeQT/bp7hxeZmPBiP1sEta/s4frFbY\nYRpuITjSftNhXcwdlbWUoT+XzwvfBCsgGNrP31hPeFEqpcdi8ulxFY+FbPQix6+U\nUazf1ttnaVO4Gz7JKGapuEM9fLTIwKemavcK4pgJ+RUbSiLH3xKJW2zVIc/zA/BJ\nMS2iL6i9BtM0wpGgm4QwnQCs99e78y9wGmup+gxsAa1eg/sb2Pyrwkir8M4/eXOL\n30Um9c9XTjWk7NJxbw0lgKVs1YRQpBzp005Md6rgD+1h+fZNA6bBino25h4Y8VqI\ngRPfzefW78nt4gXD+eDav1meuyHLd6ZcO7sZRcNGOQKBgQDzPJD2T3UNFyU/QXW3\ngxltqB+zUmGhVRQMdryBWi1VLzh1mbZMoAHKnj4b5yh6AYlX7BEcMiK6IIrda2Zt\nkZiW2YJccPBd6wBgohtN0MQ0/dc5+B/0YWBc3bMvglU/8pMrp6fBW+54F6nxQJ0h\ndYRTDblWxYnLIt6362ZE4gFX9wKBgQDlXwZWQ3jnpiN003LLVC7IyDF9Ll3ONhIY\nDARaTgr/QzHEHPDB36wRK7zDY5jjAhWlPtQ5Ri469w+cDJPI3g8py7GoxbD+wPd1\nUM6u2JzzADKWOg/p8n+6VY5Bcq/sQjHPD6WbdAg4/nQHj9GIbckKeqAecgjwwlOJ\ntN+JaJKefwKBgQC6s0KRzWuLILj2VMiGk5pxERtECXfm3ecFqh4HK7CgMh6kJdhH\n+IlnfQ8vW7815vgFBK4ddl4xf8kXK9jzQU5ee5YUXpwhesBPbB6JHDV+d1k8pbfh\nXN0aaxGe5euJqihM2eNqB6aDh6ZqB66UgB+RoHcio32g7qMFiSp2tQNTAQKBgADU\nWCSFt/E2g5hPj3G2yziEqNEoEsTFI0mc+YMOFzIXHx3zcNdypJ+nRdZ7DLl9b3Ca\nio/udgpWjGLnFL28N9fR2cGffWVec0akVSsCs4aZcJVkflw9OUMGPi50aLh1ANMb\n3mByifkSyn6ggYR5ySlVijCx/uBIA59S3SAVFbqnAoGAIKByrIwXM6pM240tOmeH\nei3kxzOBnxU7dkZWR/mZY0fNueoQtIY7GFwCu7dQjn+ZObpuDDshR6b9vsp+2k+e\naDKcf7Ij9amTcWvR3T6S+SLYWAQW4LQPjBpkvPvQaq+ThR8LR3FLCsDSSq307/9F\n0FOOZUXMgk4tM2mK94f/csA=\n-----END PRIVATE KEY-----\n
```

**Option 2: Multi-line (if Option 1 doesn't work):**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZ73crglVkLuuO
w45HDRjsduoH4WmcLv8FXBW1T/ttsvQFh3v6MJyp6SMUr+vpc3QyQWu5NauJ9Nim
LOAhgVekis3MC48BjGGQjPdJdSMzKYLklvwdrlcyefyIGWk6Ekjjf6xvZhZlaNyM
t5izgLNr7GMEJTBwIBNbrNKlX2VL4mGLD00sI5BopshU8r09+FkR6s5gXOqWYIze
DJq4oFXNVUDjTF90RES8OOyBVN7vxFPUDD52KzA7ZPLH/+Wkcr2TDkSO1jnX4+7P
tjNRYBBBoz8xY5lCqpEte1AD7DANqn/gSkAq+9y96UfIOOgA3+Xe/W9O1CJXov0D
7Fh10xWJAgMBAAECggEAEuh52GaIbha8DTjeQT/bp7hxeZmPBiP1sEta/s4frFbY
YRpuITjSftNhXcwdlbWUoT+XzwvfBCsgGNrP31hPeFEqpcdi8ulxFY+FbPQix6+U
Uazf1ttnaVO4Gz7JKGapuEM9fLTIwKemavcK4pgJ+RUbSiLH3xKJW2zVIc/zA/BJ
MS2iL6i9BtM0wpGgm4QwnQCs99e78y9wGmup+gxsAa1eg/sb2Pyrwkir8M4/eXOL
30Um9c9XTjWk7NJxbw0lgKVs1YRQpBzp005Md6rgD+1h+fZNA6bBino25h4Y8VqI
gRPfzefW78nt4gXD+eDav1meuyHLd6ZcO7sZRcNGOQKBgQDzPJD2T3UNFyU/QXW3
gxltqB+zUmGhVRQMdryBWi1VLzh1mbZMoAHKnj4b5yh6AYlX7BEcMiK6IIrda2Zt
kZiW2YJccPBd6wBgohtN0MQ0/dc5+B/0YWBc3bMvglU/8pMrp6fBW+54F6nxQJ0h
dYRTDblWxYnLIt6362ZE4gFX9wKBgQDlXwZWQ3jnpiN003LLVC7IyDF9Ll3ONhIY
DARaTgr/QzHEHPDB36wRK7zDY5jjAhWlPtQ5Ri469w+cDJPI3g8py7GoxbD+wPd1
UM6u2JzzADKWOg/p8n+6VY5Bcq/sQjHPD6WbdAg4/nQHj9GIbckKeqAecgjwwlOJ
tN+JaJKefwKBgQC6s0KRzWuLILj2VMiGk5pxERtECXfm3ecFqh4HK7CgMh6kJdhH
+IlnfQ8vW7815vgFBK4ddl4xf8kXK9jzQU5ee5YUXpwhesBPbB6JHDV+d1k8pbfh
XN0aaxGe5euJqihM2eNqB6aDh6ZqB66UgB+RoHcio32g7qMFiSp2tQNTAQKBgADU
WCSFt/E2g5hPj3G2yziEqNEoEsTFI0mc+YMOFzIXHx3zcNdypJ+nRdZ7DLl9b3Ca
io/udgpWjGLnFL28N9fR2cGffWVec0akVSsCs4aZcJVkflw9OUMGPi50aLh1ANMb
3mByifkSyn6ggYR5ySlVijCx/uBIA59S3SAVFbqnAoGAIKByrIwXM6pM240tOmeH
ei3kxzOBnxU7dkZWR/mZY0fNueoQtIY7GFwCu7dQjn+ZObpuDDshR6b9vsp+2k+e
aDKcf7Ij9amTcWvR3T6S+SLYWAQW4LQPjBpkvPvQaq+ThR8LR3FLCsDSSq307/9F
0FOOZUXMgk4tM2mK94f/csA=
-----END PRIVATE KEY-----
```

---

## How to Add to Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project: **prosticker**
3. Go to: **Settings → Environment Variables**
4. Add each variable above
5. Select environment: **Production, Preview, Development** (all three)
6. Click **Save**

After saving, Vercel will automatically redeploy your project with the new environment variables.

---

## Test After Deployment:

```bash
curl -X POST https://prosticker.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_abc123xyz456" \
  -d '{
    "order_id": "TEST-001",
    "product_type": "ribbons",
    "quantity": 50,
    "delivery_date": "2026-03-15",
    "notes": "Test order from webhook"
  }'
```

Expected response:
```json
{
  "success": true,
  "orderId": "...",
  "orderNumber": "WEB-TEST-001",
  "message": "Order created successfully"
}
```
