import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    onSnapshot,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
    designedAt?: Date | Timestamp;

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

        const docRef = await addDoc(collection(db, 'orders'), newOrder);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create order');
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
