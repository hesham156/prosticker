import React, { useState } from 'react';
import { updateOrderStatus } from '../../services/orderService';
import type { Order } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/OrderDetails.css';

interface OrderDetailsProps {
    order: Order;
    onClose: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose }) => {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [productionNotes, setProductionNotes] = useState(order.productionNotes || '');

    const handleStatusChange = async (newStatus: Order['status']) => {
        if (!order.id || !userData?.uid) return;

        try {
            setLoading(true);
            await updateOrderStatus(order.id, newStatus, productionNotes, userData.uid);
            window.location.reload(); // Simple refresh for now
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate) {
            return date.toDate().toLocaleString('ar-EG');
        }
        return new Date(date).toLocaleString('ar-EG');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>تفاصيل الطلب / Order Details</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="order-details-content">
                    {/* Sales Section */}
                    <div className="detail-section">
                        <h3>بيانات المبيعات / Sales Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>اسم العميل / Customer:</label>
                                <span>{order.customerName}</span>
                            </div>
                            <div className="detail-item">
                                <label>رقم الهاتف / Phone:</label>
                                <span>{order.customerPhone}</span>
                            </div>
                            <div className="detail-item">
                                <label>نوع الطلب / Type:</label>
                                <span>{order.orderType}</span>
                            </div>
                            <div className="detail-item">
                                <label>الكمية / Quantity:</label>
                                <span>{order.quantity}</span>
                            </div>
                            <div className="detail-item">
                                <label>تاريخ التسليم / Delivery:</label>
                                <span>{order.deliveryDate}</span>
                            </div>
                            <div className="detail-item full-width">
                                <label>ملاحظات المبيعات / Sales Notes:</label>
                                <span>{order.salesNotes || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <label>تاريخ الإنشاء / Created:</label>
                                <span>{formatDate(order.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Design Section */}
                    {order.designFileUrl && (
                        <div className="detail-section">
                            <h3>بيانات التصميم / Design Information</h3>
                            <div className="detail-grid">
                                <div className="detail-item full-width">
                                    <label>ملف التصميم / Design File:</label>
                                    <a href={order.designFileUrl} target="_blank" rel="noopener noreferrer">
                                        فتح الملف / Open File
                                    </a>
                                </div>
                                <div className="detail-item">
                                    <label>الأبعاد / Dimensions:</label>
                                    <span>{order.dimensions}</span>
                                </div>
                                <div className="detail-item">
                                    <label>الألوان / Colors:</label>
                                    <span>{order.colors}</span>
                                </div>
                                <div className="detail-item">
                                    <label>المادة / Material:</label>
                                    <span>{order.material}</span>
                                </div>
                                <div className="detail-item">
                                    <label>التشطيب / Finishing:</label>
                                    <span>{order.finishing}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>ملاحظات التصميم / Design Notes:</label>
                                    <span>{order.designNotes || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>تاريخ التصميم / Designed:</label>
                                    <span>{formatDate(order.designedAt)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Production Section */}
                    <div className="detail-section">
                        <h3>معلومات الإنتاج / Production Information</h3>
                        <div className="form-group">
                            <label>ملاحظات الإنتاج / Production Notes:</label>
                            <textarea
                                value={productionNotes}
                                onChange={(e) => setProductionNotes(e.target.value)}
                                rows={4}
                                placeholder="أضف ملاحظات الإنتاج..."
                            />
                        </div>

                        <div className="current-status">
                            <label>الحالة الحالية / Current Status:</label>
                            <span className={`status-badge status-${order.status}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {order.status === 'pending-production' && (
                            <button
                                className="btn-action btn-start"
                                onClick={() => handleStatusChange('in-production')}
                                disabled={loading}
                            >
                                بدء الإنتاج / Start Production
                            </button>
                        )}

                        {order.status === 'in-production' && (
                            <button
                                className="btn-action btn-complete"
                                onClick={() => handleStatusChange('completed')}
                                disabled={loading}
                            >
                                إتمام الطلب / Mark as Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
