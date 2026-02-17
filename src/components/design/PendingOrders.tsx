import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { updateOrderWithDesign } from '../../services/orderService';
import type { Order, CustomField } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { getProductTypeById } from '../../config/productTypes';
import CustomFieldsManager from '../common/CustomFieldsManager';
import OrderSearch from '../common/OrderSearch';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [startingDesign, setStartingDesign] = useState(false);

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

            // Search in sales notes
            if (order.salesNotes?.toLowerCase().includes(search)) return true;

            // Search in assigned designer name
            if (order.assignedDesignerName?.toLowerCase().includes(search)) return true;

            return false;
        });
    }, [orders, searchTerm]);

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

    const handleStartDesign = async (order: Order) => {
        if (!userData?.uid || !order.id) return;

        try {
            setStartingDesign(true);
            const { startDesignWork } = await import('../../services/orderService');
            await startDesignWork(order.id, userData.uid);
            // Order will auto-update via real-time listener
        } catch (err: any) {
            setError(err.message);
        } finally {
            setStartingDesign(false);
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

    if (filteredOrders.length === 0 && searchTerm) {
        return (
            <div className="pending-orders">
                <OrderSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <div className="empty-state">
                    <p>لا توجد نتائج للبحث "{searchTerm}"</p>
                    <p>No results found for "{searchTerm}"</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-orders">
            <OrderSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <div className="orders-grid">
                {filteredOrders.map((order) => {
                    const productType = getProductTypeById(order.productType || '');
                    return (
                        <div key={order.id} className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}>
                            <div className="order-info">
                                {/* Order Number */}
                                <h3>#{order.orderNumber}</h3>

                                {/* Product Type */}
                                {productType && (
                                    <p className="order-type">
                                        <strong>{productType.nameAr} / {productType.nameEn}</strong>
                                    </p>
                                )}

                                {/* Basic Info */}
                                <p><strong>الكمية / Quantity:</strong> {order.quantity}</p>
                                <p><strong>تاريخ التسليم / Delivery:</strong> {order.deliveryDate}</p>

                                {/* Assigned Designer */}
                                {order.assignedDesignerName && (
                                    <p><strong>المصمم المسؤول / Designer:</strong> {order.assignedDesignerName}</p>
                                )}

                                {/* Sales Notes */}
                                {order.salesNotes && (
                                    <p className="notes"><strong>ملاحظات المبيعات / Sales Notes:</strong> {order.salesNotes}</p>
                                )}

                                {/* Time Tracking */}
                                {order.designStartedAt && (
                                    <p className="time-info">
                                        <strong>⏰ بدأ في:</strong> {new Date(order.designStartedAt instanceof Date ? order.designStartedAt : order.designStartedAt.toDate()).toLocaleString('ar-EG')}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {!order.designedBy ? (
                                <button
                                    className="btn-start-design"
                                    onClick={() => handleStartDesign(order)}
                                    disabled={startingDesign}
                                >
                                    {startingDesign ? '...' : '▶️ بدء التصميم'}
                                </button>
                            ) : (
                                <button
                                    className="btn-design"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    ✅ إكمال وإرسال للإنتاج
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedOrder && createPortal(
                <div className="design-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>إضافة تفاصيل التصميم / Add Design Details</h2>
                            <button className="btn-close" onClick={() => setSelectedOrder(null)}>×</button>
                        </div>

                        {/* Sales Data Section */}
                        <div className="sales-data-section">
                            <h3>بيانات المبيعات / Sales Data</h3>
                            <div className="sales-info-grid">
                                <div className="info-item">
                                    <label>رقم الأوردر / Order Number:</label>
                                    <span>{selectedOrder.orderNumber}</span>
                                </div>

                                {(() => {
                                    const productType = getProductTypeById(selectedOrder.productType || '');
                                    return productType ? (
                                        <div className="info-item">
                                            <label>نوع المنتج / Product Type:</label>
                                            <span>{productType.nameAr} / {productType.nameEn}</span>
                                        </div>
                                    ) : null;
                                })()}

                                <div className="info-item">
                                    <label>الكمية / Quantity:</label>
                                    <span>{selectedOrder.quantity} وحدة</span>
                                </div>

                                <div className="info-item">
                                    <label>تاريخ التسليم / Delivery Date:</label>
                                    <span>{selectedOrder.deliveryDate}</span>
                                </div>

                                {selectedOrder.assignedDesignerName && (
                                    <div className="info-item">
                                        <label>المصمم المسؤول / Assigned Designer:</label>
                                        <span>{selectedOrder.assignedDesignerName}</span>
                                    </div>
                                )}

                                {selectedOrder.salesNotes && (
                                    <div className="info-item full-width">
                                        <label>ملاحظات المبيعات / Sales Notes:</label>
                                        <span>{selectedOrder.salesNotes}</span>
                                    </div>
                                )}

                                {/* Product Configuration */}
                                {selectedOrder.productConfig && Object.keys(selectedOrder.productConfig).length > 0 && (
                                    <div className="info-item full-width">
                                        <label>تفاصيل المنتج / Product Details:</label>
                                        <div className="product-config">
                                            {Object.entries(selectedOrder.productConfig).map(([key, value]) => (
                                                <span key={key} className="config-item">
                                                    <strong>{key}:</strong> {String(value)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Fields from Sales */}
                                {selectedOrder.customFields && selectedOrder.customFields.filter(f => f.addedByRole === 'sales').length > 0 && (
                                    <div className="info-item full-width">
                                        <label>حقول إضافية من المبيعات / Sales Custom Fields:</label>
                                        <div className="custom-fields-display">
                                            {selectedOrder.customFields
                                                .filter(f => f.addedByRole === 'sales')
                                                .map((field, idx) => (
                                                    <div key={idx} className="custom-field-item">
                                                        <strong>{field.name}:</strong> {String(field.value)}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
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
