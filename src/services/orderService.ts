import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    Timestamp,
    orderBy,
    increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createMondayItemFromOrder } from './mondayService';

export interface Order {
    id?: string;
    // Sales Data
    orderNumber: string; // رقم الأوردر / Order Number
    customerName?: string; // Legacy field for backward compatibility
    customerPhone?: string; // Legacy field for backward compatibility
    orderType: string; // Legacy field for backward compatibility
    productType?: string; // New: Product type ID (e.g., 'belts', 'ribbons')
    productConfig?: Record<string, any>; // New: Dynamic product configuration
    quantity: number;
    deliveryDate: string;
    salesNotes: string;
    createdBy: string;
    createdAt: Date | Timestamp;

    // Designer Assignment (NEW)
    assignedDesignerId?: string; // UID of designer assigned to this order
    assignedDesignerName?: string; // Name for display purposes

    // Design Data (optional, added by Design role)
    designFileUrl?: string;
    dimensions?: string;
    colors?: string;
    material?: string;
    finishing?: string;
    designNotes?: string;
    printingType?: 'thermal' | 'silkscreen'; // نوع الطباعة
    thermalSubType?: 'sugaris' | 'sublimation'; // نوع فرعي للحراري
    designedBy?: string;
    designStartedAt?: Date | Timestamp; // When designer started working
    designedAt?: Date | Timestamp; // When designer completed

    // Production Data (optional)
    productionNotes?: string;
    completedBy?: string;
    completedAt?: Date | Timestamp;

    // Status Tracking
    status: 'pending-design' | 'pending-production' | 'in-production' | 'completed';

    // Custom Fields (dynamic fields added by any department)
    customFields?: CustomField[];

    // Workflow timestamps
    sentToDesignAt?: Date | Timestamp;
    sentToProductionAt?: Date | Timestamp;

    // Monday.com integration
    mondayItemId?: string; // Store Monday Design Board item ID
    mondayProductionItemId?: string; // Store Monday Production Board item ID

    // Sub-items support
    isParentOrder?: boolean; // true if order has sub-items
    subitemsCount?: number; // Count of sub-items
}

export interface CustomField {
    id: string;
    name: string;                                    // Field label/name
    type: 'text' | 'number' | 'date' | 'select';    // Field type
    value: any;                                      // The actual value
    options?: string[];                              // For select type
    addedBy: string;                                 // User ID who added this field
    addedByRole?: 'sales' | 'design' | 'production' | 'admin'; // Department
    addedAt?: Date | Timestamp;                      // When it was added
}

// Create new order (Sales)
export const createOrder = async (orderData: Partial<Order>, userId: string): Promise<string> => {
    try {
        const newOrder: Partial<Order> = {
            ...orderData,
            createdBy: userId,
            createdAt: Timestamp.now(),
            status: 'pending-design',
            sentToDesignAt: Timestamp.now()
        };

        // Remove undefined fields (Firebase doesn't allow undefined values)
        Object.keys(newOrder).forEach(key => {
            if (newOrder[key as keyof Order] === undefined) {
                delete newOrder[key as keyof Order];
            }
        });

        // Create order in Firebase
        const docRef = await addDoc(collection(db, 'orders'), newOrder);
        const orderId = docRef.id;

        // Add ID to order object for Monday sync
        const orderWithId = { ...newOrder, id: orderId } as Order;

        // Sync to Monday.com (non-blocking - don't fail if Monday fails)
        // If designer is assigned, use their personal board, otherwise use default
        (async () => {
            try {
                let designerBoardId: string | undefined;

                // Fetch designer's Monday board ID if designer is assigned
                if (orderData.assignedDesignerId) {
                    const designerDoc = await getDoc(doc(db, 'users', orderData.assignedDesignerId));
                    if (designerDoc.exists()) {
                        const designerData = designerDoc.data();
                        designerBoardId = designerData?.mondayBoardId;
                        if (designerBoardId) {
                            console.log(`🎯 Assigning to designer's board: ${designerBoardId}`);
                        }
                    }
                }

                const mondayItemId = await createMondayItemFromOrder(orderWithId, designerBoardId);

                if (mondayItemId) {
                    // Update order with Monday item ID for future reference
                    await updateDoc(doc(db, 'orders', orderId), { mondayItemId });
                    console.log(`✅ Order ${orderId} synced to Monday (Item ID: ${mondayItemId})`);
                }
            } catch (error) {
                console.warn('⚠️ Monday sync failed, but order was created successfully:', error);
            }
        })();

        return orderId;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create order');
    }
};

// Start working on design (Designer clicks "Start Design")
export const startDesignWork = async (
    orderId: string,
    userId: string
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            designedBy: userId,
            designStartedAt: Timestamp.now()
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to start design work');
    }
};

// Update order with design details (Design)
export const updateOrderWithDesign = async (
    orderId: string,
    designData: Partial<Order>,
    userId: string
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            ...designData,
            designedBy: userId,
            designedAt: Timestamp.now(),
            status: 'pending-production',
            sentToProductionAt: Timestamp.now()
        });

        // Get the updated order for Monday sync
        const orderDoc = await getDoc(orderRef);
        const order = { id: orderId, ...orderDoc.data() } as Order;

        // Sync to Monday.com Production Board (non-blocking)
        (async () => {
            try {
                const { getMondaySettings, createMondayItemFromOrder } = await import('./mondayService');

                const settings = await getMondaySettings();

                // Create item in Production Board if integration is enabled
                if (settings.enabled && settings.productionBoardId) {
                    const mondayItemId = await createMondayItemFromOrder(order, settings.productionBoardId);

                    if (mondayItemId) {
                        // Update order with production Monday item ID
                        await updateDoc(orderRef, { mondayProductionItemId: mondayItemId });
                        console.log(`✅ Order ${orderId} synced to Production Board (Item ID: ${mondayItemId})`);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Monday production sync failed, but order was updated successfully:', error);
            }
        })();
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update order');
    }
};

// Update order (Sales/Admin edit)
export const updateOrder = async (
    orderId: string,
    orderData: Partial<Order>
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        // Don't update status or workflow timestamps, just order data
        await updateDoc(orderRef, orderData);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update order');
    }
};

// Update order status (Production)
export const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    productionNotes?: string,
    userId?: string
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const updateData: any = { status };

        if (status === 'completed' && userId) {
            updateData.completedBy = userId;
            updateData.completedAt = Timestamp.now();
        }

        if (productionNotes) {
            updateData.productionNotes = productionNotes;
        }

        await updateDoc(orderRef, updateData);

        // Update Monday status if item exists (System → Monday direction)
        const { updateMondayItemStatus, getMondaySettings } = await import('./mondayService');
        const orderDoc = await getDocs(query(collection(db, 'orders'), where('__name__', '==', orderId)));
        const order = orderDoc.docs[0]?.data() as Order;
        const mondaySettings = await getMondaySettings();

        if (order?.mondayItemId) {
            updateMondayItemStatus(
                order.mondayItemId,
                status,
                mondaySettings.designBoardId || undefined
            ).catch((error) => {
                console.warn('⚠️ Failed to update Monday design board status:', error);
            });
        }

        if (order?.mondayProductionItemId) {
            updateMondayItemStatus(
                order.mondayProductionItemId,
                status,
                mondaySettings.productionBoardId || undefined
            ).catch((error) => {
                console.warn('⚠️ Failed to update Monday production board status:', error);
            });
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update status');
    }
};

// Fetch orders by status
export const fetchOrdersByStatus = async (status: Order['status']): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        return orders;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch orders');
    }
};

// Fetch all orders
export const fetchAllOrders = async (): Promise<Order[]> => {
    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        return orders;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch orders');
    }
};

// Fetch orders created by specific user
export const fetchOrdersByUser = async (userId: string): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        return orders;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch orders');
    }
};

// Real-time listener for orders
export const subscribeToOrders = (
    callback: (orders: Order[]) => void,
    statusFilter?: Order['status']
): (() => void) => {
    let q;

    if (statusFilter) {
        q = query(
            collection(db, 'orders'),
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc')
        );
    } else {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        callback(orders);
    });

    return unsubscribe;
};

// ===== Sub-Items (Subtasks) =====

export interface SubItem {
    id?: string;
    productType: string;
    productConfig?: Record<string, any>;
    quantity: number;
    salesNotes?: string;
    modifications?: string;
    fileLinks?: string[];
    status: 'pending-design' | 'pending-production' | 'in-production' | 'completed';
    // Design data
    designFileUrl?: string;
    designNotes?: string;
    designedBy?: string;
    designedAt?: Date | Timestamp;
    // Timestamps
    createdAt: Date | Timestamp;
    createdBy?: string;
    completedAt?: Date | Timestamp;
}

// Create a sub-item under a parent order
export const createSubItem = async (
    parentOrderId: string,
    subItemData: Partial<SubItem>,
    userId: string
): Promise<string> => {
    try {
        const newSubItem: Partial<SubItem> = {
            ...subItemData,
            createdBy: userId,
            createdAt: Timestamp.now(),
            status: 'pending-design'
        };

        // Remove undefined fields
        Object.keys(newSubItem).forEach(key => {
            if (newSubItem[key as keyof SubItem] === undefined) {
                delete newSubItem[key as keyof SubItem];
            }
        });

        const subItemsRef = collection(db, 'orders', parentOrderId, 'subitems');
        const docRef = await addDoc(subItemsRef, newSubItem);

        // Update parent order metadata
        const parentRef = doc(db, 'orders', parentOrderId);
        await updateDoc(parentRef, {
            isParentOrder: true,
            subitemsCount: increment(1)
        });

        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create sub-item');
    }
};

// Fetch all sub-items for an order
export const fetchSubItems = async (parentOrderId: string): Promise<SubItem[]> => {
    try {
        const q = query(
            collection(db, 'orders', parentOrderId, 'subitems'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubItem));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch sub-items');
    }
};

// Real-time listener for sub-items
export const subscribeToSubItems = (
    parentOrderId: string,
    callback: (subItems: SubItem[]) => void
): (() => void) => {
    const q = query(
        collection(db, 'orders', parentOrderId, 'subitems'),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const items: SubItem[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SubItem));
        callback(items);
    });
};

// Update a sub-item with design data
export const updateSubItemWithDesign = async (
    parentOrderId: string,
    subItemId: string,
    designData: Partial<SubItem>,
    userId: string
): Promise<void> => {
    try {
        const subItemRef = doc(db, 'orders', parentOrderId, 'subitems', subItemId);
        await updateDoc(subItemRef, {
            ...designData,
            designedBy: userId,
            designedAt: Timestamp.now(),
            status: 'pending-production'
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update sub-item');
    }
};

// Update sub-item status
export const updateSubItemStatus = async (
    parentOrderId: string,
    subItemId: string,
    status: SubItem['status'],
    userId?: string
): Promise<void> => {
    try {
        const subItemRef = doc(db, 'orders', parentOrderId, 'subitems', subItemId);
        const updateData: any = { status };
        if (status === 'completed' && userId) {
            updateData.completedAt = Timestamp.now();
        }
        await updateDoc(subItemRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update sub-item status');
    }
};

// Find order by order number
export const findOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('orderNumber', '==', orderNumber)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docData = snapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Order;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to find order');
    }
};
