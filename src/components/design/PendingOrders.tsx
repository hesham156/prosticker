import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateOrderWithDesign } from '../../services/orderService';
import type { Order, CustomField } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import CustomFieldsManager from '../common/CustomFieldsManager';
import '../../styles/DesignForm.css';

interface DesignFormData {
    designFileUrl: string;
    dimensions: string;
    colors: string;
    material: string;
    finishing: string;
    printingType?: string;
    thermalSubType?: string;
    designNotes: string;
}

interface PendingOrdersProps {
    orders: Order[];
    onOrderUpdated: () => void;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ orders, onOrderUpdated }) => {
    const { userData } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<DesignFormData>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    const onSubmit = async (data: DesignFormData) => {
        if (!selectedOrder?.id || !userData?.uid) return;

        try {
            setLoading(true);
            setError('');

            // Convert empty strings to undefined for proper typing
            const designData = {
                ...data,
                printingType: (data.printingType && data.printingType !== '')
                    ? data.printingType as 'thermal' | 'silkscreen'
                    : undefined,
                thermalSubType: (data.thermalSubType && data.thermalSubType !== '')
                    ? data.thermalSubType as 'sugaris' | 'sublimation'
                    : undefined,
                customFields: [
                    ...(selectedOrder.customFields || []),
                    ...customFields
                ]
            };

            await updateOrderWithDesign(selectedOrder.id, designData, userData.uid);

            reset();
            setCustomFields([]);
            setSelectedOrder(null);
            onOrderUpdated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <p>لا توجد طلبات قيد الانتظار</p>
                <p>No pending orders</p>
            </div>
        );
    }

    return (
        <div className="pending-orders">
            <div className="orders-grid">
                {orders.map((order) => (
                    <div key={order.id} className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}>
                        <div className="order-info">
                            <h3>{order.customerName}</h3>
                            <p className="order-type">{order.orderType}</p>
                            <p><strong>الكمية / Quantity:</strong> {order.quantity}</p>
                            <p><strong>تاريخ التسليم / Delivery:</strong> {order.deliveryDate}</p>
                            {order.salesNotes && (
                                <p className="notes"><strong>ملاحظات / Notes:</strong> {order.salesNotes}</p>
                            )}
                        </div>
                        <button
                            className="btn-design"
                            onClick={() => setSelectedOrder(order)}
                        >
                            بدء التصميم / Start Design
                        </button>
                    </div>
                ))}
            </div>

            {selectedOrder && createPortal(
                <div className="design-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>إضافة تفاصيل التصميم / Add Design Details</h2>
                            <button className="btn-close" onClick={() => setSelectedOrder(null)}>×</button>
                        </div>

                        <div className="customer-info">
                            <h3>{selectedOrder.customerName}</h3>
                            <p>{selectedOrder.orderType} - {selectedOrder.quantity} وحدة</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="design-form">
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label>رابط ملف التصميم / Design File URL *</label>
                                <input
                                    type="url"
                                    {...register('designFileUrl', { required: 'Design file URL is required' })}
                                    placeholder="https://..."
                                />
                                {errors.designFileUrl && <span className="error">{errors.designFileUrl.message}</span>}
                            </div>

                            {/* Printing Type */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>نوع الطباعة / Printing Type</label>
                                    <select {...register('printingType')}>
                                        <option value="">اختر نوع الطباعة / Select Type</option>
                                        <option value="thermal">حراري / Thermal</option>
                                        <option value="silkscreen">سيلف سكرين / Silkscreen</option>
                                    </select>
                                </div>

                                {/* Conditional field - only show if thermal is selected */}
                                {watch('printingType') === 'thermal' && (
                                    <div className="form-group">
                                        <label>نوع الحراري / Thermal Sub-Type</label>
                                        <select {...register('thermalSubType')}>
                                            <option value="">اختر النوع / Select Type</option>
                                            <option value="sugaris">ورق سوجريس / Sugaris Paper</option>
                                            <option value="sublimation">سبليميشن / Sublimation</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>الأبعاد / Dimensions *</label>
                                    <input
                                        type="text"
                                        {...register('dimensions', { required: 'Dimensions required' })}
                                        placeholder="9x5 cm"
                                    />
                                    {errors.dimensions && <span className="error">{errors.dimensions.message}</span>}
                                </div>

                                <div className="form-group">
                                    <label>الألوان / Colors *</label>
                                    <input
                                        type="text"
                                        {...register('colors', { required: 'Colors required' })}
                                        placeholder="CMYK - Full Color"
                                    />
                                    {errors.colors && <span className="error">{errors.colors.message}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>المادة / Material *</label>
                                    <input
                                        type="text"
                                        {...register('material', { required: 'Material required' })}
                                        placeholder="300gsm Matt Paper"
                                    />
                                    {errors.material && <span className="error">{errors.material.message}</span>}
                                </div>

                                <div className="form-group">
                                    <label>التشطيب / Finishing *</label>
                                    <select {...register('finishing', { required: 'Finishing required' })}>
                                        <option value="">اختر التشطيب</option>
                                        <option value="none">بدون / None</option>
                                        <option value="matte-lamination">لامينيشن مط / Matte Lamination</option>
                                        <option value="glossy-lamination">لامينيشن لامع / Glossy Lamination</option>
                                        <option value="uv">UV طباعة</option>
                                        <option value="embossing">نقش / Embossing</option>
                                        <option value="die-cutting">قطع / Die-Cutting</option>
                                    </select>
                                    {errors.finishing && <span className="error">{errors.finishing.message}</span>}
                                </div>
                            </div>

                            {/* Custom Fields */}
                            {userData && (
                                <CustomFieldsManager
                                    fields={customFields}
                                    onChange={setCustomFields}
                                    userId={userData.uid}
                                    userRole="design"
                                />
                            )}

                            <div className="form-group">
                                <label>ملاحظات التصميم / Design Notes</label>
                                <textarea
                                    {...register('designNotes')}
                                    placeholder="أي ملاحظات إضافية..."
                                    rows={4}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setSelectedOrder(null)}>
                                    إلغاء / Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? 'جاري الإرسال...' : 'إرسال للإنتاج / Send to Production'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PendingOrders;
