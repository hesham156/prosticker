// Monday.com Integration Service
import type { Order } from './orderService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Settings Interface
export interface MondaySettings {
    enabled: boolean;
    apiToken: string;
    designBoardId: string;
    productionBoardId: string;
    autoSync: boolean;
    lastSync?: Date;
    updatedAt?: Date;
    updatedBy?: string;
}

const MONDAY_API_URL = 'https://api.monday.com/v2';

interface MondayColumn {
    [key: string]: string | number;
}

/**
 * Get Monday.com integration settings from Firebase
 */
export async function getMondaySettings(): Promise<MondaySettings> {
    try {
        const docRef = doc(db, 'settings', 'monday_integration');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Return default settings if not configured yet
            return {
                enabled: false,
                apiToken: '',
                designBoardId: '',
                productionBoardId: '',
                autoSync: false
            };
        }

        const data = docSnap.data();
        return {
            enabled: data?.enabled || false,
            apiToken: data?.apiToken || '',
            designBoardId: data?.designBoardId || '',
            productionBoardId: data?.productionBoardId || '',
            autoSync: data?.autoSync || false,
            lastSync: data?.lastSync?.toDate(),
            updatedAt: data?.updatedAt?.toDate(),
            updatedBy: data?.updatedBy
        };
    } catch (error) {
        console.error('Error fetching Monday settings:', error);
        throw error;
    }
}

/**
 * Save Monday.com integration settings to Firebase
 */
export async function saveMondaySettings(
    settings: MondaySettings,
    userId: string
): Promise<void> {
    try {
        const docRef = doc(db, 'settings', 'monday_integration');

        await setDoc(docRef, {
            enabled: settings.enabled,
            apiToken: settings.apiToken,
            designBoardId: settings.designBoardId,
            productionBoardId: settings.productionBoardId,
            autoSync: settings.autoSync,
            lastSync: settings.lastSync || null,
            updatedAt: new Date(),
            updatedBy: userId
        });
    } catch (error) {
        console.error('Error saving Monday settings:', error);
        throw error;
    }
}

/**
 * Send GraphQL query to Monday API
 */
async function mondayQuery(query: string, variables?: any, apiToken?: string) {
    try {
        // Load settings to get API token if not provided
        const settings = apiToken ? null : await getMondaySettings();
        const token = apiToken || settings?.apiToken || '';

        if (!token) {
            throw new Error('Monday API token not configured');
        }

        const response = await fetch(MONDAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'API-Version': '2024-10'
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('Monday API Error:', result.errors);
            throw new Error(result.errors[0]?.message || 'Monday API request failed');
        }

        return result.data;
    } catch (error) {
        console.error('Failed to communicate with Monday:', error);
        throw error;
    }
}

/**
 * Test Monday.com API connection with provided token
 */
export async function testMondayConnectionWithToken(apiToken: string): Promise<{ success: boolean; message: string }> {
    try {
        const query = `
            query {
                me {
                    name
                    email
                }
            }
        `;

        const response = await fetch(MONDAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiToken
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();

        if (result.errors) {
            return { success: false, message: result.errors[0]?.message || 'Invalid API token' };
        }

        if (result.data?.me) {
            return { success: true, message: `Connected as ${result.data.me.name}` };
        }

        return { success: false, message: 'Unable to verify connection' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Connection failed' };
    }
}

/**
 * Get board columns to map our data correctly
 */
export async function getMondayBoardColumns() {
    const query = `
        query {
            boards(ids: [${MONDAY_BOARD_ID}]) {
                columns {
                    id
                    title
                    type
                }
            }
        }
    `;

    const data = await mondayQuery(query);
    return data.boards[0]?.columns || [];
}

/**
 * Create a new item in Monday board when a sales order is created
 * @param order - The order to create item from
 * @param targetBoardId - Optional specific board ID (e.g., designer's personal board)
 */
export async function createMondayItemFromOrder(
    order: Order,
    targetBoardId?: string
): Promise<string | null> {
    try {
        // Load Monday settings
        const settings = await getMondaySettings();

        // Check if Monday integration is enabled
        if (!settings.enabled) {
            console.log('⏸️ Monday integration is disabled');
            return null;
        }

        // Check if API token is configured
        if (!settings.apiToken) {
            console.warn('⚠️ Monday API token not configured');
            return null;
        }

        // Determine which board to use based on order status
        let boardId = targetBoardId;

        if (!boardId) {
            // Use design board for new orders (pending-design status)
            if (order.status === 'pending-design' && settings.designBoardId) {
                boardId = settings.designBoardId;
                console.log('📋 Using Design Board:', boardId);
            }
            // Use production board for production orders
            else if ((order.status === 'pending-production' || order.status === 'in-production') && settings.productionBoardId) {
                boardId = settings.productionBoardId;
                console.log('🏭 Using Production Board:', boardId);
            }
            else {
                console.warn('⚠️ No board ID configured for order status:', order.status);
                return null;
            }
        }


        // Format the item name using order number instead of customer name
        const itemName = `${order.orderNumber} - ${order.orderType}`;

        // Prepare column values based on your Monday board structure
        const columnValues: MondayColumn = {};

        // Map order data to Monday columns
        // You'll need to adjust these column IDs based on your actual board
        if (order.id) {
            columnValues['order_id'] = order.id; // رقم الطلب
        }

        if (order.deliveryDate) {
            // Format date for Monday (YYYY-MM-DD)
            columnValues['delivery_date'] = order.deliveryDate;
        }

        if (order.status) {
            // Map status to Monday status column
            // Board status labels: {0: working on it اشتغل عليه, 1: Done تم, 2: Stuck متوقف, 5: new جديد}
            const statusMap: { [key: string]: string } = {
                'pending-design': 'new جديد',
                'pending-production': 'working on it اشتغل عليه',
                'in-production': 'working on it اشتغل عليه',
                'completed': 'Done تم'
            };
            columnValues['status'] = statusMap[order.status] || 'new جديد';
        }

        // Create the mutation
        const mutation = `
            mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
                create_item(
                    board_id: $boardId,
                    item_name: $itemName,
                    column_values: $columnValues
                ) {
                    id
                    name
                }
            }
        `;

        const variables = {
            boardId: boardId,
            itemName: itemName,
            columnValues: JSON.stringify(columnValues)
        };

        const data = await mondayQuery(mutation, variables);

        const mondayItemId = data.create_item?.id;

        console.log(`✅ Created Monday item: ${itemName} (ID: ${mondayItemId}) in Board: ${boardId}`);

        return mondayItemId;

    } catch (error) {
        console.error('❌ Failed to create Monday item:', error);
        // Don't throw - we don't want Monday sync failures to break order creation
        return null;
    }
}

/**
 * Update Monday item when order status changes
 */
export async function updateMondayItemStatus(
    mondayItemId: string,
    newStatus: string
): Promise<boolean> {
    try {
        // Board status labels: {0: working on it اشتغل عليه, 1: Done تم, 2: Stuck متوقف, 5: new جديد}
        const statusMap: { [key: string]: string } = {
            'pending-design': 'new جديد',
            'pending-production': 'working on it اشتغل عليه',
            'in-production': 'working on it اشتغل عليه',
            'completed': 'Done تم'
        };

        const mutation = `
            mutation UpdateStatus($itemId: ID!, $columnValues: JSON!) {
                change_multiple_column_values(
                    item_id: $itemId,
                    board_id: ${MONDAY_BOARD_ID},
                    column_values: $columnValues
                ) {
                    id
                }
            }
        `;

        const variables = {
            itemId: mondayItemId,
            columnValues: JSON.stringify({
                status: statusMap[newStatus] || newStatus
            })
        };

        await mondayQuery(mutation, variables);

        console.log(`✅ Updated Monday item ${mondayItemId} status to: ${newStatus}`);

        return true;

    } catch (error) {
        console.error('❌ Failed to update Monday item:', error);
        return false;
    }
}

/**
 * Add a note/comment to a Monday item
 */
export async function addMondayNote(
    mondayItemId: string,
    note: string
): Promise<boolean> {
    try {
        const mutation = `
            mutation AddNote($itemId: ID!, $text: String!) {
                create_update(
                    item_id: $itemId,
                    body: $text
                ) {
                    id
                }
            }
        `;

        const variables = {
            itemId: mondayItemId,
            text: note
        };

        await mondayQuery(mutation, variables);

        console.log(`✅ Added note to Monday item ${mondayItemId}`);

        return true;

    } catch (error) {
        console.error('❌ Failed to add Monday note:', error);
        return false;
    }
}

/**
 * Test Monday connection
 */
export async function testMondayConnection(): Promise<boolean> {
    try {
        const query = `
            query {
                me {
                    name
                    email
                }
                boards(ids: [${MONDAY_BOARD_ID}]) {
                    name
                    id
                }
            }
        `;

        const data = await mondayQuery(query);

        console.log('✅ Monday connection successful!');
        console.log('User:', data.me);
        console.log('Board:', data.boards[0]);

        return true;

    } catch (error) {
        console.error('❌ Monday connection failed:', error);
        return false;
    }
}
