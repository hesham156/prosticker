import React from 'react';
import type { Order } from '../../services/orderService';
import '../../styles/ProductionQueue.css';

interface ProductionQueueProps {
    orders: Order[];
    onSelectOrder: (order: Order) => void;
}

const ProductionQueue: React.FC<ProductionQueueProps> = ({ orders, onSelectOrder }) => {
    const getStatusBadge = (status: Order['status']) => {
        const badges: { [key: string]: { label: string; class: string } } = {
            'pending-design': { label: 'قيد التصميم', class: 'badge-design' },
            'pending-production': { label: 'جاهز للإنتاج', class: 'badge-ready' },
            'in-production': { label: 'قيد الإنتاج', class: 'badge-progress' },
            'completed': { label: 'مكتمل', class: 'badge-complete' }
        };
        return badges[status] || { label: status, class: '' };
    };

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <p>لا توجد طلبات</p>
                <p>No orders</p>
            </div>
        );
    }

    return (
        <div className="production-queue">
            <div className="queue-table">
                <table>
                    <thead>
                        <tr>
                            <th>العميل / Customer</th>
                            <th>النوع / Type</th>
                            <th>الكمية / Qty</th>
                            <th>التسليم / Delivery</th>
                            <th>الحالة / Status</th>
                            <th>إجراءات /Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <div className="customer-cell">
                                        <strong>{order.customerName}</strong>
                                        <small>{order.customerPhone}</small>
                                    </div>
                                </td>
                                <td>{order.orderType}</td>
                                <td>{order.quantity}</td>
                                <td>{order.deliveryDate}</td>
                                <td>
                                    <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                        {getStatusBadge(order.status).label}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-view"
                                        onClick={() => onSelectOrder(order)}
                                    >
                                        عرض / View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductionQueue;
