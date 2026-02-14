import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import PendingOrders from '../components/design/PendingOrders';
import { fetchOrdersByStatus, subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import '../styles/Dashboard.css';

const DesignDashboard: React.FC = () => {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for pending design orders
        const unsubscribe = subscribeToOrders((orders) => {
            const pending = orders.filter(order => order.status === 'pending-design');
            setPendingOrders(pending);
            setLoading(false);
        }, 'pending-design');

        loadCompletedOrders();

        return () => unsubscribe();
    }, []);

    const loadCompletedOrders = async () => {
        try {
            const completed = await fetchOrdersByStatus('pending-production');
            setCompletedOrders(completed);
        } catch (error) {
            console.error('Error loading completed orders:', error);
        }
    };

    const handleOrderUpdated = () => {
        loadCompletedOrders();
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة التصميم / Design Dashboard</h1>
                </div>

                <div className="design-sections">
                    <div className="pending-section">
                        <h2>طلبات قيد الانتظار / Pending Orders ({pendingOrders.length})</h2>
                        {loading ? (
                            <div className="loading">جاري التحميل...</div>
                        ) : (
                            <PendingOrders
                                orders={pendingOrders}
                                onOrderUpdated={handleOrderUpdated}
                            />
                        )}
                    </div>

                    <div className="completed-section">
                        <h2>تم إرسالها للإنتاج / Sent to Production ({completedOrders.length})</h2>
                        <div className="orders-grid">
                            {completedOrders.map(order => (
                                <div key={order.id} className="order-card completed">
                                    <div className="order-info">
                                        <h3>{order.customerName}</h3>
                                        <p className="order-type">{order.orderType}</p>
                                    </div>
                                    <span className="status-badge success">Sent to Production</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignDashboard;
