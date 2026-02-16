import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Validate API Key
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or missing API key'
            });
        }

        // 2. Get webhook data
        const data = req.body;

        // 3. Validate required fields
        const requiredFields = ['product_type', 'quantity', 'delivery_date'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missing: missingFields,
                received: Object.keys(data)
            });
        }

        // 4. Validate data types
        const quantity = parseInt(data.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({
                error: 'Invalid quantity',
                message: 'Quantity must be a positive number'
            });
        }

        // 5. Create order data
        const orderData = {
            orderNumber: `WEB-${data.order_id || Date.now()}`,
            productType: data.product_type,
            productConfig: data.product_config || {},
            quantity: quantity,
            deliveryDate: data.delivery_date,
            salesNotes: data.notes
                ? `${data.notes}\n\n[Auto-created from online store]`
                : '[Auto-created from online store]',
            assignedDesignerId: data.designer_id || null,
            assignedDesignerName: data.designer_name || null,
            status: 'pending-design' as const,
            createdBy: 'webhook-system',
            createdAt: Timestamp.now(),
            customFields: Array.isArray(data.custom_fields) ? data.custom_fields : []
        };

        // 6. Create order in Firestore
        const orderRef = await db.collection('orders').add(orderData);

        // 7. Log webhook event
        await db.collection('webhook_logs').add({
            orderId: orderRef.id,
            orderNumber: orderData.orderNumber,
            webhookData: data,
            timestamp: Timestamp.now(),
            status: 'success',
            source: req.headers['user-agent'] || 'unknown'
        });

        // 8. Return success response
        return res.status(200).json({
            success: true,
            orderId: orderRef.id,
            orderNumber: orderData.orderNumber,
            message: 'Order created successfully'
        });

    } catch (error: any) {
        console.error('Webhook error:', error);

        // Log error to Firestore
        try {
            await db.collection('webhook_logs').add({
                webhookData: req.body,
                timestamp: Timestamp.now(),
                status: 'error',
                error: error.message,
                stack: error.stack
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
