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

// Helper: Detect if webhook is from Salla
function isSallaWebhook(body: any): boolean {
    return body && typeof body === 'object' && 'event' in body && 'merchant' in body;
}

// Helper: Extract product type from item name or SKU
function extractProductType(itemName: string, sku?: string): string {
    const text = `${itemName} ${sku || ''}`.toLowerCase();

    // Check for product type keywords
    if (text.includes('ribbon') || text.includes('شريط')) return 'ribbons';
    if (text.includes('belt') || text.includes('حزام')) return 'belts';
    if (text.includes('sticker') || text.includes('استيكر') || text.includes('ملصق')) return 'stickers';

    // Default to custom if no match
    return 'custom';
}

// Helper: Transform Salla order data to our order model
function transformSallaOrder(sallaData: any) {
    const orderData = sallaData.data;

    // Only process confirmed/completed orders
    const allowedStatuses = ['completed', 'under-review', 'in-progress'];
    const isValidStatus = orderData.status && allowedStatuses.includes(orderData.status.slug);

    if (orderData.draft || !isValidStatus) {
        return {
            shouldProcess: false,
            reason: `Order is ${orderData.draft ? 'draft' : 'not confirmed'} (status: ${orderData.status?.name || 'unknown'})`
        };
    }

    // Extract first item or combine items
    const items = orderData.items || [];
    const firstItem = items[0] || {};
    const productType = items.length > 0
        ? extractProductType(firstItem.name, firstItem.sku)
        : 'custom';

    // Build product configuration from items
    const productConfig: any = {
        source: 'salla',
        sallaOrderId: orderData.id,
        items: items.map((item: any) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price
        }))
    };

    // Calculate delivery date: order date + 7 days
    const orderDate = new Date(orderData.date?.date || Date.now());
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    // Extract customer info
    const customer = orderData.customer || {};
    const customerInfo = `Customer: ${customer.first_name || ''} ${customer.last_name || ''}
Phone: ${customer.mobile || customer.mobile_code || 'N/A'}
Email: ${customer.email || 'N/A'}`;

    // Calculate total quantity
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (parseInt(item.quantity) || 0), 0);

    return {
        shouldProcess: true,
        orderData: {
            orderNumber: `SALLA-${orderData.reference_id || orderData.id}`,
            productType,
            productConfig,
            quantity: totalQuantity || 1,
            deliveryDate: deliveryDate.toISOString().split('T')[0], // YYYY-MM-DD format
            salesNotes: `${customerInfo}

Order Total: ${orderData.amounts?.total || 0} ${orderData.currency || ''}
Payment Method: ${orderData.payment_method || 'N/A'}

[Auto-created from Salla store - Event: ${sallaData.event}]`,
            assignedDesignerId: null,
            assignedDesignerName: null,
            status: 'pending-design' as const,
            createdBy: 'salla-webhook',
            createdAt: Timestamp.now(),
            customFields: [{
                label: 'Salla Order ID',
                value: String(orderData.id)
            }, {
                label: 'Salla Reference ID',
                value: String(orderData.reference_id)
            }, {
                label: 'Order Total',
                value: `${orderData.amounts?.total || 0} ${orderData.currency || ''}`
            }]
        },
        sallaMetadata: {
            merchant: sallaData.merchant,
            event: sallaData.event,
            orderId: orderData.id,
            referenceId: orderData.reference_id
        }
    };
}

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

        // 2. Detect webhook source
        const isSalla = isSallaWebhook(req.body);
        let orderData: any;
        let webhookSource: string;
        let sallaMetadata: any = null;

        if (isSalla) {
            // Process Salla webhook
            webhookSource = 'salla';
            const transformation = transformSallaOrder(req.body);

            // Log the event even if we don't process it
            await db.collection('webhook_logs').add({
                source: 'salla',
                event: req.body.event,
                merchant: req.body.merchant,
                orderId: req.body.data?.id,
                referenceId: req.body.data?.reference_id,
                shouldProcess: transformation.shouldProcess,
                reason: transformation.reason || 'Valid order',
                timestamp: Timestamp.now(),
                rawData: req.body
            });

            // If order shouldn't be processed (draft, pending, etc.), return success without creating order
            if (!transformation.shouldProcess) {
                return res.status(200).json({
                    success: true,
                    message: 'Event logged but not processed',
                    reason: transformation.reason
                });
            }

            orderData = transformation.orderData;
            sallaMetadata = transformation.sallaMetadata;

        } else {
            // Process custom webhook (Make.com, etc.)
            webhookSource = 'custom';
            const data = req.body;

            // 3. Validate required fields for custom webhooks
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

            // 5. Create order data from custom webhook
            orderData = {
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
        }

        // 6. Create order in Firestore
        const orderRef = await db.collection('orders').add(orderData);

        // 7. Log webhook event
        const logData: any = {
            source: webhookSource,
            orderId: orderRef.id,
            orderNumber: orderData.orderNumber,
            webhookData: req.body,
            timestamp: Timestamp.now(),
            status: 'success',
            userAgent: req.headers['user-agent'] || 'unknown'
        };

        // Add Salla-specific metadata to log
        if (sallaMetadata) {
            logData.salla = sallaMetadata;
        }

        await db.collection('webhook_logs').add(logData);

        // 8. Return success response
        return res.status(200).json({
            success: true,
            orderId: orderRef.id,
            orderNumber: orderData.orderNumber,
            message: 'Order created successfully',
            source: webhookSource
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
