// Monday.com Integration Service
import type { Order } from './orderService';

const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYwMDEzMDI5NywiYWFpIjoxMSwidWlkIjo5NzQyOTUwNywiaWFkIjoiMjAyNS0xMi0yMlQwOTowNTozMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTM3NTE4NzUsInJnbiI6InVzZTEifQ.qexht75pJCU5N6nTNGoQ9WFLJsenPKXndnVGfudaRmE';
const MONDAY_BOARD_ID = '18396347159'; // Your board ID

interface MondayColumn {
    [key: string]: string | number;
}

/**
 * Send GraphQL query to Monday API
 */
async function mondayQuery(query: string, variables?: any) {
    try {
        const response = await fetch(MONDAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': MONDAY_API_TOKEN,
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
        // Use designer's board if provided, otherwise use default board
        const boardId = targetBoardId || MONDAY_BOARD_ID;

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
            // New board status labels: {5: جديد, 1: قيد التنفيذ, 15: جاهز للاستلام}
            const statusMap: { [key: string]: string } = {
                'pending-design': 'قيد التنفيذ',
                'pending-production': 'قيد التنفيذ',
                'in-production': 'قيد التنفيذ',
                'completed': 'جاهز للاستلام'
            };
            columnValues['status'] = statusMap[order.status] || 'جديد';
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
        // New board status labels: {5: جديد, 1: قيد التنفيذ, 15: جاهز للاستلام}
        const statusMap: { [key: string]: string } = {
            'pending-design': 'قيد التنفيذ',
            'pending-production': 'قيد التنفيذ',
            'in-production': 'قيد التنفيذ',
            'completed': 'جاهز للاستلام'
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
