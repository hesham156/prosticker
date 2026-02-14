import React from 'react';
import type { Order } from '../../services/orderService';
import ProductConfigDisplay from '../common/ProductConfigDisplay';
import '../../styles/Modal.css';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate) {
            return date.toDate().toLocaleString('ar-EG');
        }
        return new Date(date).toLocaleString('ar-EG');
    };

    const getStatusBadge = (status: Order['status']) => {
        const badges: { [key: string]: { label: string; class: string } } = {
            'pending-design': { label: 'قيد التصميم / Pending Design', class: 'status-pending' },
            'pending-production': { label: 'قيد الإنتاج / Pending Production', class: 'status-progress' },
            'in-production': { label: 'تحت التنفيذ / In Production', class: 'status-progress' },
            'completed': { label: 'مكتمل / Completed', class: 'status-complete' }
        };
        return badges[status] || { label: status, class: '' };
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>تفاصيل الطلب / Order Details</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Order Number & Status */}
                    <div className="detail-section">
                        <div className="detail-row">
                            <span className="detail-label">رقم الأوردر / Order Number:</span>
                            <span className="detail-value">{order.orderNumber || order.customerName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">الحالة / Status:</span>
                            <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                {getStatusBadge(order.status).label}
                            </span>
                        </div>
                    </div>

                    {/* Product Configuration */}
                    <div className="detail-section">
                        <h3>تكوين المنتج / Product Configuration</h3>
                        <ProductConfigDisplay order={order} />
                    </div>

                    {/* Order Details */}
                    <div className="detail-section">
                        <h3>تفاصيل الطلب / Order Information</h3>
                        <div className="detail-row">
                            <span className="detail-label">الكمية / Quantity:</span>
                            <span className="detail-value">{order.quantity}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">تاريخ التسليم / Delivery Date:</span>
                            <span className="detail-value">{order.deliveryDate}</span>
                        </div>
                        {order.salesNotes && (
                            <div className="detail-row">
                                <span className="detail-label">ملاحظات المبيعات / Sales Notes:</span>
                                <span className="detail-value">{order.salesNotes}</span>
                            </div>
                        )}
                    </div>

                    {/* Design Details (if available) */}
                    {order.designedBy && (
                        <div className="detail-section">
                            <h3>تفاصيل التصميم / Design Details</h3>
                            {order.designFileUrl && (
                                <div className="detail-row">
                                    <span className="detail-label">ملف التصميم / Design File:</span>
                                    <a href={order.designFileUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
                                        عرض الملف / View File
                                    </a>
                                </div>
                            )}
                            {order.dimensions && (
                                <div className="detail-row">
                                    <span className="detail-label">الأبعاد / Dimensions:</span>
                                    <span className="detail-value">{order.dimensions}</span>
                                </div>
                            )}
                            {order.colors && (
                                <div className="detail-row">
                                    <span className="detail-label">الألوان / Colors:</span>
                                    <span className="detail-value">{order.colors}</span>
                                </div>
                            )}
                            {order.material && (
                                <div className="detail-row">
                                    <span className="detail-label">المادة / Material:</span>
                                    <span className="detail-value">{order.material}</span>
                                </div>
                            )}
                            {order.finishing && (
                                <div className="detail-row">
                                    <span className="detail-label">التشطيب / Finishing:</span>
                                    <span className="detail-value">{order.finishing}</span>
                                </div>
                            )}
                            {order.printingType && (
                                <div className="detail-row">
                                    <span className="detail-label">نوع الطباعة / Printing Type:</span>
                                    <span className="detail-value">
                                        {order.printingType === 'thermal' ? 'حراري / Thermal' : 'سيلف سكرين / Silkscreen'}
                                        {order.printingType === 'thermal' && order.thermalSubType && (
                                            <span> - {order.thermalSubType === 'sugaris' ? 'ورق سوجريس / Sugaris' : 'سبليميشن / Sublimation'}</span>
                                        )}
                                    </span>
                                </div>
                            )}
                            {order.designNotes && (
                                <div className="detail-row">
                                    <span className="detail-label">ملاحظات التصميم / Design Notes:</span>
                                    <span className="detail-value">{order.designNotes}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom Fields (if any) */}
                    {order.customFields && order.customFields.length > 0 && (
                        <div className="detail-section">
                            <h3>حقول مخصصة / Custom Fields</h3>

                            {/* Group by department */}
                            {['sales', 'design', 'production', 'admin'].map(role => {
                                const roleFields = order.customFields?.filter(f => f.addedByRole === role);
                                if (!roleFields || roleFields.length === 0) return null;

                                const roleName = {
                                    'sales': 'المبيعات / Sales',
                                    'design': 'التصميم / Design',
                                    'production': 'الإنتاج / Production',
                                    'admin': 'الإدارة / Admin'
                                }[role];

                                return (
                                    <div key={role} className="custom-fields-group">
                                        <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem', marginBottom: '0.75rem' }}>
                                            {roleName}
                                        </h4>
                                        {roleFields.map(field => (
                                            <div key={field.id} className="detail-row">
                                                <span className="detail-label">
                                                    {field.name}
                                                    <span className="field-type-badge" style={{
                                                        marginLeft: '0.5rem',
                                                        padding: '0.2rem 0.4rem',
                                                        fontSize: '0.7rem',
                                                        background: 'rgba(168, 85, 247, 0.2)',
                                                        color: '#c084fc',
                                                        borderRadius: '4px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {field.type}
                                                    </span>
                                                </span>
                                                <span className="detail-value">
                                                    {field.value || 'N/A'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Production Details (if available) */}
                    {order.completedBy && (
                        <div className="detail-section">
                            <h3>تفاصيل الإنتاج / Production Details</h3>
                            {order.productionNotes && (
                                <div className="detail-row">
                                    <span className="detail-label">ملاحظات الإنتاج / Production Notes:</span>
                                    <span className="detail-value">{order.productionNotes}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="detail-section">
                        <h3>الجدول الزمني / Timeline</h3>
                        <div className="timeline">
                            <div className="timeline-item">
                                <span className="timeline-label">تم الإنشاء / Created:</span>
                                <span className="timeline-value">{formatDate(order.createdAt)}</span>
                            </div>
                            {order.sentToDesignAt && (
                                <div className="timeline-item">
                                    <span className="timeline-label">أرسل للتصميم / Sent to Design:</span>
                                    <span className="timeline-value">{formatDate(order.sentToDesignAt)}</span>
                                </div>
                            )}
                            {order.sentToProductionAt && (
                                <div className="timeline-item">
                                    <span className="timeline-label">أرسل للإنتاج / Sent to Production:</span>
                                    <span className="timeline-value">{formatDate(order.sentToProductionAt)}</span>
                                </div>
                            )}
                            {order.completedAt && (
                                <div className="timeline-item">
                                    <span className="timeline-label">تم الإكمال / Completed:</span>
                                    <span className="timeline-value">{formatDate(order.completedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        إغلاق / Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
