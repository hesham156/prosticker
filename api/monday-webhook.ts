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

// ─── Status Mapping: Monday label → System status ───────────────────────────
// Adjust these labels to match your actual Monday.com board status labels
const MONDAY_TO_SYSTEM_STATUS: Record<string, string> = {
    // Design board labels
    'new جديد': 'pending-design',
    'working on it اشتغل عليه': 'in-production',
    'done تم': 'completed',
    'stuck متوقف': 'pending-production',
    // Fallback lowercase variants
    'new': 'pending-design',
    'working on it': 'in-production',
    'done': 'completed',
    'stuck': 'pending-production',
};

function normalizeLabel(label: string): string {
    return label?.trim().toLowerCase() ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        // ── 1. Monday.com Challenge Verification ──────────────────────────────
        // When you first register a webhook URL in Monday.com, it sends a
        // { challenge: "..." } payload. We must echo it back.
        if (body?.challenge) {
            console.log('✅ Monday.com webhook challenge received');
            return res.status(200).json({ challenge: body.challenge });
        }

        // ── 2. Validate Webhook Secret (optional but recommended) ─────────────
        const settingsDoc = await db.collection('settings').doc('monday_integration').get();
        const settings = settingsDoc.data();

        if (settings?.mondayWebhookSecret) {
            const authHeader = req.headers['authorization'] || '';
            const providedSecret = authHeader.replace('Bearer ', '').trim();
            if (providedSecret !== settings.mondayWebhookSecret) {
                console.warn('⚠️ Monday webhook: invalid secret');
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        // ── 3. Check if Monday integration is enabled ─────────────────────────
        if (!settings?.enabled) {
            return res.status(200).json({ message: 'Monday integration is disabled' });
        }

        // ── 4. Parse the Event ────────────────────────────────────────────────
        // Monday sends: { event: { type, pulseId, columnId, value, ... } }
        const event = body?.event;

        if (!event) {
            return res.status(400).json({ error: 'No event in payload' });
        }

        console.log('📥 Monday webhook event:', JSON.stringify(event, null, 2));

        // We only care about column value changes on the status column
        if (event.type !== 'update_column_value') {
            return res.status(200).json({ message: `Event type "${event.type}" ignored` });
        }

        // Extract the new status label from the event
        // Monday sends value as: { label: { text: "Done תם" } } or { label: "Done" }
        let newLabel: string | null = null;

        if (event.value?.label?.text) {
            newLabel = event.value.label.text;
        } else if (typeof event.value?.label === 'string') {
            newLabel = event.value.label;
        } else if (event.value?.name) {
            newLabel = event.value.name;
        }

        if (!newLabel) {
            console.log('ℹ️ No status label found in event, skipping');
            return res.status(200).json({ message: 'No status label found, skipped' });
        }

        const normalizedLabel = normalizeLabel(newLabel);
        const systemStatus = MONDAY_TO_SYSTEM_STATUS[normalizedLabel];

        if (!systemStatus) {
            console.log(`ℹ️ Unknown Monday label: "${newLabel}", skipping`);
            return res.status(200).json({ message: `Unknown label "${newLabel}", skipped` });
        }

        const mondayItemId = String(event.pulseId);

        // ── 5. Find the order in Firestore by mondayItemId ────────────────────
        let orderRef: FirebaseFirestore.DocumentReference | null = null;
        let orderId: string | null = null;

        // Search in design board items
        const designQuery = await db.collection('orders')
            .where('mondayItemId', '==', mondayItemId)
            .limit(1)
            .get();

        if (!designQuery.empty) {
            orderRef = designQuery.docs[0].ref;
            orderId = designQuery.docs[0].id;
        } else {
            // Search in production board items
            const productionQuery = await db.collection('orders')
                .where('mondayProductionItemId', '==', mondayItemId)
                .limit(1)
                .get();

            if (!productionQuery.empty) {
                orderRef = productionQuery.docs[0].ref;
                orderId = productionQuery.docs[0].id;
            }
        }

        if (!orderRef || !orderId) {
            console.log(`ℹ️ No order found for Monday item ID: ${mondayItemId}`);
            // Log the miss so admin can investigate
            await db.collection('monday_webhook_logs').add({
                mondayItemId,
                newLabel,
                systemStatus,
                result: 'order_not_found',
                timestamp: Timestamp.now(),
                rawEvent: event
            });
            return res.status(200).json({ message: 'Order not found, skipped' });
        }

        // ── 6. Update order status in Firestore ───────────────────────────────
        const currentOrder = (await orderRef.get()).data();
        const currentStatus = currentOrder?.status;

        if (currentStatus === systemStatus) {
            console.log(`ℹ️ Order ${orderId} already has status "${systemStatus}", skipping`);
            return res.status(200).json({ message: 'Status unchanged, skipped' });
        }

        const updateData: Record<string, any> = {
            status: systemStatus,
            lastSyncedFromMonday: Timestamp.now(),
        };

        // Add completion timestamp if marking as completed
        if (systemStatus === 'completed') {
            updateData.completedAt = Timestamp.now();
            updateData.completedBy = 'monday-sync';
        }

        await orderRef.update(updateData);

        console.log(`✅ Order ${orderId} status updated: "${currentStatus}" → "${systemStatus}" (from Monday item ${mondayItemId})`);

        // ── 7. Log the sync event ─────────────────────────────────────────────
        await db.collection('monday_webhook_logs').add({
            mondayItemId,
            orderId,
            previousStatus: currentStatus,
            newStatus: systemStatus,
            mondayLabel: newLabel,
            result: 'success',
            timestamp: Timestamp.now(),
            rawEvent: event
        });

        return res.status(200).json({
            success: true,
            orderId,
            previousStatus: currentStatus,
            newStatus: systemStatus,
            message: `Order status updated to "${systemStatus}"`
        });

    } catch (error: any) {
        console.error('❌ Monday webhook error:', error);

        try {
            await db.collection('monday_webhook_logs').add({
                result: 'error',
                error: error.message,
                timestamp: Timestamp.now(),
                rawBody: req.body
            });
        } catch (_) { /* ignore log errors */ }

        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
