import React, { useState } from 'react';
import type { Order } from '../../services/orderService';
import OrderDetailsModal from './OrderDetailsModal';
import EditOrderModal from '../common/EditOrderModal';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminComponents.css';
import '../../styles/ProductConfig.css';

interface AllOrdersViewProps {
    orders: Order[];
    onOrdersChange?: () => void;
}

const AllOrdersView: React.FC<AllOrdersViewProps> = ({ orders, onOrdersChange }) => {
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    const getStatusBadge = (status: Order['status']) => {
        const badges: { [key: string]: { label: string; class: string } } = {
            'pending-design': { label: 'قيد التصميم', class: 'badge-design' },
            'pending-production': { label: 'قيد الإنتاج', class: 'badge-ready' },
            'in-production': { label: 'تحت التنفيذ', class: 'badge-progress' },
            'completed': { label: 'مكتمل', class: 'badge-complete' }
        };
        return badges[status] || { label: status, class: '' };
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate) {
            return date.toDate().toLocaleDateString('ar-EG');
        }
        return new Date(date).toLocaleDateString('ar-EG');
    };

    // Calculate duration between two timestamps
    const toMs = (d: any): number | null => {
        if (!d) return null;
        if (d.toDate) return d.toDate().getTime();
        return new Date(d).getTime();
    };

    const calcDuration = (start: any, end: any): { text: string; isOngoing: boolean } | null => {
        const startMs = toMs(start);
        if (!startMs) return null;
        const endMs = toMs(end) || Date.now();
        const isOngoing = !toMs(end);
        const diffMs = endMs - startMs;
        if (diffMs < 0) return null;

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        let text = '';
        if (days > 0) text += `${days}ي `;
        if (hours > 0) text += `${hours}س `;
        text += `${minutes}د`;

        return { text: text.trim(), isOngoing };
    };

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (order.orderNumber?.toLowerCase().includes(searchLower)) ||
            (order.customerName?.toLowerCase().includes(searchLower)) ||
            (order.customerPhone?.includes(searchTerm)) ||
            (order.orderType?.toLowerCase().includes(searchLower)) ||
            (order.productType?.toLowerCase().includes(searchLower));
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="all-orders-view">
            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="بحث... / Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter"
                >
                    <option value="all">جميع الحالات / All Statuses</option>
                    <option value="pending-design">قيد التصميم / Pending Design</option>
                    <option value="pending-production">قيد الإنتاج / Pending Production</option>
                    <option value="in-production">تحت التنفيذ / In Production</option>
                    <option value="completed">مكتمل / Completed</option>
                </select>
            </div>

            <div className="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>رقم الأوردر / Order #</th>
                            <th>النوع / Type</th>
                            <th>الكمية / Qty</th>
                            <th>التسليم / Delivery</th>
                            <th>الحالة / Status</th>
                            <th>مدة التصميم</th>
                            <th>مدة الانتاج</th>
                            <th>تاريخ الإنشاء / Created</th>
                            <th>الإجراءات / Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.orderNumber || order.customerName || 'N/A'}</td>
                                <td>{order.productType || order.orderType || 'N/A'}</td>
                                <td>{order.quantity}</td>
                                <td>{order.deliveryDate}</td>
                                <td>
                                    <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                        {getStatusBadge(order.status).label}
                                    </span>
                                </td>
                                <td>
                                    {(() => {
                                        const d = calcDuration(order.sentToDesignAt || order.createdAt, order.designedAt);
                                        if (!d) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>;
                                        return (
                                            <span className={`duration-badge ${d.isOngoing ? 'duration-ongoing' : 'duration-done'}`}>
                                                {d.isOngoing ? '⏳' : '✅'} {d.text}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td>
                                    {(() => {
                                        const d = calcDuration(order.sentToProductionAt, order.completedAt);
                                        if (!d) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>;
                                        return (
                                            <span className={`duration-badge ${d.isOngoing ? 'duration-ongoing' : 'duration-done'}`}>
                                                {d.isOngoing ? '⏳' : '✅'} {d.text}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn-view"
                                            onClick={() => setSelectedOrder(order)}
                                            title="عرض التفاصيل / View Details"
                                        >
                                            <span>عرض / View</span>
                                        </button>
                                        <button
                                            className="btn-edit"
                                            onClick={() => setEditingOrder(order)}
                                            title="تعديل / Edit"
                                        >
                                            <span>تعديل / Edit</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="empty-state">
                        <p>لا توجد طلبات</p>
                        <p>No orders found</p>
                    </div>
                )}
            </div>

            <div className="orders-summary">
                <p>إجمالي الطلبات / Total Orders: {filteredOrders.length}</p>
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}

            {editingOrder && userData && (
                <EditOrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSuccess={() => {
                        setEditingOrder(null);
                        onOrdersChange?.();
                    }}
                    userRole="admin"
                    userId={userData.uid}
                />
            )}
        </div>
    );
};

export default AllOrdersView;
