import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import PendingOrders from '../components/design/PendingOrders';
import { subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import '../styles/Dashboard.css';
import '../styles/KanbanBoard.css';

const DesignDashboard: React.FC = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for all design-related orders
        const unsubscribePending = subscribeToOrders((orders) => {
            setAllOrders(prevOrders => {
                const nonPending = prevOrders.filter(o => o.status !== 'pending-design');
                return [...nonPending, ...orders];
            });
            setLoading(false);
        }, 'pending-design');

        const unsubscribeProduction = subscribeToOrders((orders) => {
            setAllOrders(prevOrders => {
                const nonProduction = prevOrders.filter(o => o.status !== 'pending-production');
                return [...nonProduction, ...orders];
            });
        }, 'pending-production');

        return () => {
            unsubscribePending();
            unsubscribeProduction();
        };
    }, []);

    // Separate orders into columns
    const newOrders = allOrders.filter(order =>
        order.status === 'pending-design' && !order.designedBy
    );

    const inProgressOrders = allOrders.filter(order =>
        order.status === 'pending-design' && order.designedBy
    );

    const completedOrders = allOrders.filter(order =>
        order.status === 'pending-production'
    );

    const handleOrderUpdated = () => {
        // Orders will auto-update via real-time listeners
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة التصميم / Design Dashboard</h1>
                </div>

                {loading ? (
                    <div className="loading">جاري التحميل...</div>
                ) : (
                    <div className="kanban-board">
                        {/* Column 1: New from Sales */}
                        <div className="kanban-column new-column">
                            <div className="column-header">
                                <h2>🆕 جديد من المبيعات</h2>
                                <span className="count-badge">{newOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <PendingOrders
                                    orders={newOrders}
                                    onOrderUpdated={handleOrderUpdated}
                                />
                            </div>
                        </div>

                        {/* Column 2: In Progress */}
                        <div className="kanban-column progress-column">
                            <div className="column-header">
                                <h2>⚙️ قيد التنفيذ</h2>
                                <span className="count-badge">{inProgressOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <PendingOrders
                                    orders={inProgressOrders}
                                    onOrderUpdated={handleOrderUpdated}
                                />
                            </div>
                        </div>

                        {/* Column 3: Sent to Production */}
                        <div className="kanban-column completed-column">
                            <div className="column-header">
                                <h2>✅ تم التسليم للإنتاج</h2>
                                <span className="count-badge">{completedOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <div className="orders-list">
                                    {completedOrders.map(order => (
                                        <div key={order.id} className="order-card completed">
                                            <div className="order-info">
                                                <h3>#{order.orderNumber}</h3>
                                                <p className="order-type">{order.productType}</p>
                                                <p className="delivery-date">📅 {order.deliveryDate}</p>
                                            </div>
                                            <span className="status-badge success">تم</span>
                                        </div>
                                    ))}
                                    {completedOrders.length === 0 && (
                                        <div className="empty-column">
                                            <p>لا توجد طلبات مكتملة</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesignDashboard;
