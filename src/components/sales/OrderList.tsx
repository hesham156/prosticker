import React, { useState, useMemo } from 'react';
import type { Order } from '../../services/orderService';
import ProductConfigDisplay from '../common/ProductConfigDisplay';
import EditOrderModal from '../common/EditOrderModal';
import OrderDetailsModal from '../admin/OrderDetailsModal';
import OrderSearch from '../common/OrderSearch';
import { useAuth } from '../../contexts/AuthContext';
import { getProductTypeById } from '../../config/productTypes';
import '../../styles/OrderList.css';
import '../../styles/ProductConfig.css';

interface OrderListProps {
    orders: Order[];
    onOrdersChange?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onOrdersChange }) => {
    const { userData } = useAuth();
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter orders based on search term
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return orders;

        const search = searchTerm.toLowerCase();
        return orders.filter(order => {
            // Search in order number
            if (order.orderNumber?.toLowerCase().includes(search)) return true;

            // Search in customer name (legacy field)
            if (order.customerName?.toLowerCase().includes(search)) return true;

            // Search in product type
            if (order.productType) {
                const productType = getProductTypeById(order.productType);
                if (productType) {
                    if (productType.nameAr.toLowerCase().includes(search)) return true;
                    if (productType.nameEn.toLowerCase().includes(search)) return true;
                }
            }

            // Search in order type (legacy field)
            if (order.orderType?.toLowerCase().includes(search)) return true;

            // Search in sales notes
            if (order.salesNotes?.toLowerCase().includes(search)) return true;

            // Search in design notes
            if (order.designNotes?.toLowerCase().includes(search)) return true;

            // Search in production notes
            if (order.productionNotes?.toLowerCase().includes(search)) return true;

            // Search in assigned designer name
            if (order.assignedDesignerName?.toLowerCase().includes(search)) return true;

            return false;
        });
    }, [orders, searchTerm]);
    const getStatusBadge = (status: Order['status']) => {
        const badges: { [key: string]: { label: string; class: string } } = {
            'pending-design': { label: 'في التصميم / Pending Design', class: 'status-pending' },
            'pending-production': { label: 'قيد الإنتاج / Pending Production', class: 'status-progress' },
            'in-production': { label: 'تحت التنفيذ / In Production', class: 'status-progress' },
            'completed': { label: 'مكتمل / Completed', class: 'status-complete' }
        };
        return badges[status] || { label: status, class: '' };
    };

    const formatDate = (date: any) => {
        if (!date) return '';
        if (date.toDate) {
            return date.toDate().toLocaleDateString('ar-EG');
        }
        return new Date(date).toLocaleDateString('ar-EG');
    };

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <p>لا توجد طلبات حتى الآن</p>
                <p>No orders yet</p>
            </div>
        );
    }

    if (filteredOrders.length === 0 && searchTerm) {
        return (
            <>
                <OrderSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <div className="empty-state">
                    <p>لا توجد نتائج للبحث "{searchTerm}"</p>
                    <p>No results found for "{searchTerm}"</p>
                </div>
            </>
        );
    }

    return (
        <>
            <OrderSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <div className="orders-list">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="order-card">
                        <div className="order-header">
                            <h3>{order.orderNumber || order.customerName || 'Order'}</h3>
                            <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                {getStatusBadge(order.status).label}
                            </span>
                        </div>

                        <div className="order-details">
                            <ProductConfigDisplay order={order} />

                            <div className="detail-row">
                                <span className="label">الكمية / Quantity:</span>
                                <span className="value">{order.quantity}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">تاريخ التسليم / Delivery:</span>
                                <span className="value">{order.deliveryDate}</span>
                            </div>
                        </div>

                        <div className="order-footer">
                            <span className="date">تم الإنشاء / Created: {formatDate(order.createdAt)}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn-view-details"
                                    onClick={() => setViewingOrder(order)}
                                    title="عرض التفاصيل / View Details"
                                >
                                    عرض / View
                                </button>
                                {order.status === 'pending-design' && (
                                    <button
                                        className="btn-edit-order"
                                        onClick={() => setEditingOrder(order)}
                                        title="تعديل الطلب / Edit Order"
                                    >
                                        تعديل / Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

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
                            onOrdersChange?.();
                        }}
                        userRole="sales"
                        userId={userData.uid}
                    />
                )}
            </div>
        </>
    );
};

export default OrderList;
