import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import OrderForm from '../components/sales/OrderForm';
import ProductConfigDisplay from '../components/common/ProductConfigDisplay';
import EditOrderModal from '../components/common/EditOrderModal';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import { subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import '../styles/Dashboard.css';
import '../styles/KanbanBoard.css';

const SalesDashboard: React.FC = () => {
    const { userData } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    // Real-time subscription for ALL orders
    useEffect(() => {
        const unsubscribe = subscribeToOrders((orders) => {
            setAllOrders(orders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOrderCreated = () => {
        setShowForm(false);
    };

    const formatDate = (date: any) => {
        if (!date) return '';
        if (date.toDate) {
            return date.toDate().toLocaleDateString('ar-EG');
        }
        return new Date(date).toLocaleDateString('ar-EG');
    };

    // Categorize orders into 4 groups
    const newOrders = allOrders.filter(
        o => o.status === 'pending-design' && !o.designedBy
    );
    const inDesignOrders = allOrders.filter(
        o => o.status === 'pending-design' && o.designedBy
    );
    const inProductionOrders = allOrders.filter(
        o => o.status === 'pending-production' || o.status === 'in-production'
    );
    const completedOrders = allOrders.filter(
        o => o.status === 'completed'
    );

    // Render order card for Kanban columns
    const renderOrderCard = (order: Order, statusClass: string) => (
        <div key={order.id} className={`order-card ${statusClass}`}>
            <div className="order-info">
                <h3>#{order.orderNumber}</h3>
                <ProductConfigDisplay order={order} />
                <p className="delivery-date">📅 التسليم: {order.deliveryDate}</p>
                <p className="order-quantity">📦 الكمية: {order.quantity}</p>
                {order.assignedDesignerName && (
                    <p className="designer-name">🎨 المصمم: {order.assignedDesignerName}</p>
                )}
                <p className="order-date">🕐 {formatDate(order.createdAt)}</p>
                {order.subitemsCount && order.subitemsCount > 0 && (
                    <p className="subitems-badge">📎 {order.subitemsCount} عنصر فرعي</p>
                )}
            </div>
            <div className="order-card-actions">
                <button
                    className="btn-view-small"
                    onClick={() => setViewingOrder(order)}
                >
                    عرض
                </button>
                {order.status === 'pending-design' && !order.designedBy && (
                    <button
                        className="btn-edit-small"
                        onClick={() => setEditingOrder(order)}
                    >
                        تعديل
                    </button>
                )}
            </div>
        </div>
    );

    const renderEmptyState = (message: string) => (
        <div className="empty-column">
            <div className="empty-icon">📋</div>
            <p>{message}</p>
        </div>
    );

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة المبيعات / Sales Dashboard</h1>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'إلغاء / Cancel' : '➕ طلب جديد / New Order'}
                    </button>
                </div>

                {showForm && (
                    <div className="form-section">
                        <OrderForm onSuccess={handleOrderCreated} />
                    </div>
                )}

                {loading ? (
                    <div className="loading">جاري التحميل...</div>
                ) : (
                    <div className="kanban-board sales-kanban">
                        {/* Column 1: New Orders */}
                        <div className="kanban-column new-column">
                            <div className="column-header">
                                <h2>🆕 الطلبات الجديدة</h2>
                                <span className="count-badge">{newOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <div className="orders-list">
                                    {newOrders.length > 0
                                        ? newOrders.map(o => renderOrderCard(o, 'new'))
                                        : renderEmptyState('لا توجد طلبات جديدة')
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Column 2: In Design */}
                        <div className="kanban-column design-column">
                            <div className="column-header">
                                <h2>🎨 قيد التصميم</h2>
                                <span className="count-badge">{inDesignOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <div className="orders-list">
                                    {inDesignOrders.length > 0
                                        ? inDesignOrders.map(o => renderOrderCard(o, 'designing'))
                                        : renderEmptyState('لا توجد طلبات قيد التصميم')
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Column 3: In Production */}
                        <div className="kanban-column production-column">
                            <div className="column-header">
                                <h2>⚙️ قيد الانتاج</h2>
                                <span className="count-badge">{inProductionOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <div className="orders-list">
                                    {inProductionOrders.length > 0
                                        ? inProductionOrders.map(o => renderOrderCard(o, 'producing'))
                                        : renderEmptyState('لا توجد طلبات قيد الانتاج')
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Column 4: Completed */}
                        <div className="kanban-column completed-column">
                            <div className="column-header">
                                <h2>✅ مكتمل</h2>
                                <span className="count-badge">{completedOrders.length}</span>
                            </div>
                            <div className="column-content">
                                <div className="orders-list">
                                    {completedOrders.length > 0
                                        ? completedOrders.map(o => renderOrderCard(o, 'completed'))
                                        : renderEmptyState('لا توجد طلبات مكتملة')
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewingOrder && (
                    <OrderDetailsModal
                        order={viewingOrder}
                        onClose={() => setViewingOrder(null)}
                    />
                )}

                {editingOrder && userData && (
                    <EditOrderModal
                        order={editingOrder}
                        onClose={() => setEditingOrder(null)}
                        onSuccess={() => {
                            setEditingOrder(null);
                        }}
                        userRole="sales"
                        userId={userData.uid}
                    />
                )}
            </div>
        </div>
    );
};

export default SalesDashboard;
