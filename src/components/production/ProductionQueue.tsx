import React, { useState, useMemo } from 'react';
import type { Order } from '../../services/orderService';
import { getProductTypeById } from '../../config/productTypes';
import OrderSearch from '../common/OrderSearch';
import '../../styles/ProductionQueue.css';

interface ProductionQueueProps {
    orders: Order[];
    onSelectOrder: (order: Order) => void;
}

const ProductionQueue: React.FC<ProductionQueueProps> = ({ orders, onSelectOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter orders based on search term
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return orders;

        const search = searchTerm.toLowerCase();
        return orders.filter(order => {
            // Search in order number
            if (order.orderNumber?.toLowerCase().includes(search)) return true;

            // Search in product type
            if (order.productType) {
                const productType = getProductTypeById(order.productType);
                if (productType) {
                    if (productType.nameAr.toLowerCase().includes(search)) return true;
                    if (productType.nameEn.toLowerCase().includes(search)) return true;
                }
            }

            // Search in notes
            if (order.salesNotes?.toLowerCase().includes(search)) return true;
            if (order.designNotes?.toLowerCase().includes(search)) return true;
            if (order.productionNotes?.toLowerCase().includes(search)) return true;

            return false;
        });
    }, [orders, searchTerm]);
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
                                <th>إجراءات /Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <strong>#{order.orderNumber}</strong>
                                    </td>
                                    <td>{(() => {
                                        const productType = getProductTypeById(order.productType || '');
                                        return productType ? `${productType.nameAr} / ${productType.nameEn}` : order.productType;
                                    })()}</td>
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
        </>
    );
};

export default ProductionQueue;
