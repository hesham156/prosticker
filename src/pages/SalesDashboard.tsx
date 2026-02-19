import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import OrderForm from '../components/sales/OrderForm';
import EditOrderModal from '../components/common/EditOrderModal';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import OrderSearch from '../components/common/OrderSearch';
import { subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import { getProductTypeById } from '../config/productTypes';
import '../styles/Dashboard.css';
import '../styles/ProductionQueue.css';

type FilterType = 'all' | 'pending-design' | 'in-production' | 'completed';

const SalesDashboard: React.FC = () => {
    const { userData } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

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

    // Filter by tab
    const tabFilteredOrders = useMemo(() => {
        switch (filter) {
            case 'pending-design':
                return allOrders.filter(o => o.status === 'pending-design');
            case 'in-production':
                return allOrders.filter(o =>
                    o.status === 'pending-production' || o.status === 'in-production'
                );
            case 'completed':
                return allOrders.filter(o => o.status === 'completed');
            default:
                return allOrders;
        }
    }, [allOrders, filter]);

    // Search within tab-filtered orders
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return tabFilteredOrders;
        const search = searchTerm.toLowerCase();
        return tabFilteredOrders.filter(order => {
            if (order.orderNumber?.toLowerCase().includes(search)) return true;
            if (order.customerName?.toLowerCase().includes(search)) return true;
            if (order.productType) {
                const pt = getProductTypeById(order.productType);
                if (pt) {
                    if (pt.nameAr.toLowerCase().includes(search)) return true;
                    if (pt.nameEn.toLowerCase().includes(search)) return true;
                }
            }
            if (order.salesNotes?.toLowerCase().includes(search)) return true;
            if (order.assignedDesignerName?.toLowerCase().includes(search)) return true;
            return false;
        });
    }, [tabFilteredOrders, searchTerm]);

    const getStatusBadge = (status: Order['status']) => {
        const badges: { [key: string]: { label: string; class: string } } = {
            'pending-design': { label: 'قيد التصميم', class: 'badge-design' },
            'pending-production': { label: 'جاهز للإنتاج', class: 'badge-ready' },
            'in-production': { label: 'قيد الإنتاج', class: 'badge-progress' },
            'completed': { label: 'مكتمل', class: 'badge-complete' },
        };
        return badges[status] || { label: status, class: '' };
    };

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

                {/* Filter tabs — same pattern as Production */}
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        الكل / All ({allOrders.length})
                    </button>
                    <button
                        className={filter === 'pending-design' ? 'active' : ''}
                        onClick={() => setFilter('pending-design')}
                    >
                        قيد التصميم / Design ({allOrders.filter(o => o.status === 'pending-design').length})
                    </button>
                    <button
                        className={filter === 'in-production' ? 'active' : ''}
                        onClick={() => setFilter('in-production')}
                    >
                        قيد الإنتاج / Production ({allOrders.filter(o => o.status === 'pending-production' || o.status === 'in-production').length})
                    </button>
                    <button
                        className={filter === 'completed' ? 'active' : ''}
                        onClick={() => setFilter('completed')}
                    >
                        مكتمل / Completed ({allOrders.filter(o => o.status === 'completed').length})
                    </button>
                </div>

                <div className="production-content">
                    {loading ? (
                        <div className="loading">جاري التحميل...</div>
                    ) : tabFilteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <p>لا توجد طلبات</p>
                            <p>No orders</p>
                        </div>
                    ) : (
                        <>
                            <OrderSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                            {filteredOrders.length === 0 && searchTerm ? (
                                <div className="empty-state">
                                    <p>لا توجد نتائج للبحث "{searchTerm}"</p>
                                    <p>No results found for "{searchTerm}"</p>
                                </div>
                            ) : (
                                <div className="production-queue">
                                    <div className="queue-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>رقم الأوردر / Order #</th>
                                                    <th>النوع / Type</th>
                                                    <th>الكمية / Qty</th>
                                                    <th>التسليم / Delivery</th>
                                                    <th>الحالة / Status</th>
                                                    <th>إجراءات / Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOrders.map((order) => {
                                                    const productType = getProductTypeById(order.productType || '');
                                                    const badge = getStatusBadge(order.status);
                                                    return (
                                                        <tr key={order.id}>
                                                            <td><strong>#{order.orderNumber}</strong></td>
                                                            <td>
                                                                {productType
                                                                    ? `${productType.nameAr} / ${productType.nameEn}`
                                                                    : order.productType}
                                                            </td>
                                                            <td>{order.quantity}</td>
                                                            <td>{order.deliveryDate}</td>
                                                            <td>
                                                                <span className={`status-badge ${badge.class}`}>
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button
                                                                    className="btn-view"
                                                                    onClick={() => setViewingOrder(order)}
                                                                >
                                                                    عرض / View
                                                                </button>
                                                                {order.status === 'pending-design' && (
                                                                    <button
                                                                        className="btn-view"
                                                                        style={{ background: 'var(--accent-orange, #f97316)' }}
                                                                        onClick={() => setEditingOrder(order)}
                                                                    >
                                                                        تعديل / Edit
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

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
                    onSuccess={() => setEditingOrder(null)}
                    userRole="sales"
                    userId={userData.uid}
                />
            )}
        </div>
    );
};

export default SalesDashboard;
