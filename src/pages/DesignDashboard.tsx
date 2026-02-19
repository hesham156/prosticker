import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/common/Navbar';
import PendingOrders from '../components/design/PendingOrders';
import { subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import { getProductTypeById } from '../config/productTypes';
import OrderSearch from '../components/common/OrderSearch';
import '../styles/Dashboard.css';
import '../styles/ProductionQueue.css';

type FilterType = 'all' | 'new' | 'in-progress' | 'sent';

const DesignDashboard: React.FC = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const unsubscribePending = subscribeToOrders((orders) => {
            setAllOrders(prev => {
                const rest = prev.filter(o => o.status !== 'pending-design');
                return [...rest, ...orders];
            });
            setLoading(false);
        }, 'pending-design');

        const unsubscribeProduction = subscribeToOrders((orders) => {
            setAllOrders(prev => {
                const rest = prev.filter(o => o.status !== 'pending-production');
                return [...rest, ...orders];
            });
        }, 'pending-production');

        return () => {
            unsubscribePending();
            unsubscribeProduction();
        };
    }, []);

    // Counters
    const newCount = allOrders.filter(o => o.status === 'pending-design' && !o.designedBy).length;
    const progressCount = allOrders.filter(o => o.status === 'pending-design' && o.designedBy).length;
    const sentCount = allOrders.filter(o => o.status === 'pending-production').length;

    // Tab filtering
    const tabFilteredOrders = useMemo(() => {
        switch (filter) {
            case 'new': return allOrders.filter(o => o.status === 'pending-design' && !o.designedBy);
            case 'in-progress': return allOrders.filter(o => o.status === 'pending-design' && o.designedBy);
            case 'sent': return allOrders.filter(o => o.status === 'pending-production');
            default: return allOrders;
        }
    }, [allOrders, filter]);

    // Search within tab
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return tabFilteredOrders;
        const search = searchTerm.toLowerCase();
        return tabFilteredOrders.filter(order => {
            if (order.orderNumber?.toLowerCase().includes(search)) return true;
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

    const getStatusBadge = (order: Order) => {
        if (order.status === 'pending-production')
            return { label: 'تم الإرسال للإنتاج', class: 'badge-ready' };
        if (order.status === 'pending-design' && order.designedBy)
            return { label: 'قيد التصميم', class: 'badge-progress' };
        return { label: 'جديد', class: 'badge-design' };
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة التصميم / Design Dashboard</h1>
                </div>

                {/* Filter tabs — same as Production */}
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        الكل / All ({allOrders.length})
                    </button>
                    <button
                        className={filter === 'new' ? 'active' : ''}
                        onClick={() => setFilter('new')}
                    >
                        جديد / New ({newCount})
                    </button>
                    <button
                        className={filter === 'in-progress' ? 'active' : ''}
                        onClick={() => setFilter('in-progress')}
                    >
                        قيد التصميم / In Progress ({progressCount})
                    </button>
                    <button
                        className={filter === 'sent' ? 'active' : ''}
                        onClick={() => setFilter('sent')}
                    >
                        تم الإرسال / Sent ({sentCount})
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
                                                    <th>المصمم / Designer</th>
                                                    <th>الحالة / Status</th>
                                                    <th>إجراءات / Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOrders.map((order) => {
                                                    const pt = getProductTypeById(order.productType || '');
                                                    const badge = getStatusBadge(order);
                                                    return (
                                                        <tr key={order.id}>
                                                            <td><strong>#{order.orderNumber}</strong></td>
                                                            <td>
                                                                {pt
                                                                    ? `${pt.nameAr} / ${pt.nameEn}`
                                                                    : order.productType}
                                                            </td>
                                                            <td>{order.quantity}</td>
                                                            <td>{order.deliveryDate}</td>
                                                            <td>{order.assignedDesignerName || '—'}</td>
                                                            <td>
                                                                <span className={`status-badge ${badge.class}`}>
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {order.status !== 'pending-production' && (
                                                                    <button
                                                                        className="btn-view"
                                                                        onClick={() => setSelectedOrder(order)}
                                                                    >
                                                                        {order.designedBy
                                                                            ? '✅ إكمال / Complete'
                                                                            : '▶️ بدء / Start'}
                                                                    </button>
                                                                )}
                                                                {order.status === 'pending-production' && (
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                                        تم الإرسال ✓
                                                                    </span>
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

            {/* Re-use PendingOrders for the action modal — pass only the selected order */}
            {selectedOrder && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        overflowY: 'auto',
                        padding: '2rem 1rem',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: '700px' }}>
                        <PendingOrders
                            orders={[selectedOrder]}
                            onOrderUpdated={() => setSelectedOrder(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignDashboard;
