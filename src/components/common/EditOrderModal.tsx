import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Order, CustomField } from '../../services/orderService';
import { updateOrder } from '../../services/orderService';
import { PRODUCT_TYPES, getProductTypeById, shouldShowField } from '../../config/productTypes';
import type { ProductField } from '../../config/productTypes';
import CustomFieldsManager from '../common/CustomFieldsManager';
import '../../styles/Modal.css';
import '../../styles/Forms.css';

interface EditOrderModalProps {
    order: Order;
    onClose: () => void;
    onSuccess: () => void;
    userRole: 'sales' | 'admin';
    userId: string;
}

interface OrderFormData {
    orderNumber: string;
    productType: string;
    quantity: number;
    deliveryDate: string;
    salesNotes: string;
    [key: string]: any;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSuccess, userRole, userId }) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<OrderFormData>({
        defaultValues: {
            orderNumber: order.orderNumber,
            productType: order.productType || '',
            quantity: order.quantity,
            deliveryDate: order.deliveryDate,
            salesNotes: order.salesNotes || '',
            ...(order.productConfig || {})
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>(order.customFields || []);

    const selectedProductType = watch('productType');
    const productTypeConfig = getProductTypeById(selectedProductType);
    const formValues = watch();

    const renderField = (field: ProductField) => {
        if (!shouldShowField(field, formValues)) {
            return null;
        }

        const fieldLabel = `${field.labelAr} / ${field.labelEn}${field.required ? ' *' : ''}`;
        const fieldError = errors[field.id];

        switch (field.type) {
            case 'text':
            case 'number':
                return (
                    <div className="form-group" key={field.id}>
                        <label>{fieldLabel}</label>
                        <input
                            type={field.type}
                            {...register(field.id, {
                                required: field.required ? `${field.labelEn} is required` : false,
                                valueAsNumber: field.type === 'number'
                            })}
                            placeholder={field.placeholder || ''}
                        />
                        {field.unit && <span className="field-unit">{field.unit}</span>}
                        {fieldError && <span className="error">{fieldError.message as string}</span>}
                    </div>
                );

            case 'select':
                return (
                    <div className="form-group" key={field.id}>
                        <label>{fieldLabel}</label>
                        <select
                            {...register(field.id, {
                                required: field.required ? `${field.labelEn} is required` : false
                            })}
                        >
                            <option value="">اختر / Select</option>
                            {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.labelAr} / {option.labelEn}
                                </option>
                            ))}
                        </select>
                        {fieldError && <span className="error">{fieldError.message as string}</span>}
                    </div>
                );

            case 'radio':
                return (
                    <div className="form-group" key={field.id}>
                        <label>{fieldLabel}</label>
                        <div className="radio-group">
                            {field.options?.map(option => (
                                <label key={option.value} className="radio-label">
                                    <input
                                        type="radio"
                                        value={option.value}
                                        {...register(field.id, {
                                            required: field.required ? `${field.labelEn} is required` : false
                                        })}
                                    />
                                    <span>{option.labelAr} / {option.labelEn}</span>
                                </label>
                            ))}
                        </div>
                        {fieldError && <span className="error">{fieldError.message as string}</span>}
                    </div>
                );

            default:
                return null;
        }
    };

    const onSubmit = async (data: OrderFormData) => {
        if (!order.id) return;

        try {
            setLoading(true);
            setError('');

            // Extract product configuration fields
            const productConfig: Record<string, any> = {};
            if (productTypeConfig) {
                productTypeConfig.fields.forEach(field => {
                    if (data[field.id] !== undefined) {
                        productConfig[field.id] = data[field.id];
                    }
                });
            }

            // Update order
            await updateOrder(order.id, {
                orderNumber: data.orderNumber,
                orderType: productTypeConfig?.nameEn || order.orderType,
                productType: data.productType,
                productConfig: productConfig,
                quantity: Number(data.quantity),
                deliveryDate: data.deliveryDate,
                salesNotes: data.salesNotes || '',
                customFields: customFields.length > 0 ? customFields : []
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2>تعديل الطلب / Edit Order</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit(onSubmit)} className="order-form">
                        {error && <div className="error-message">{error}</div>}

                        {/* Order Number */}
                        <div className="form-group">
                            <label>رقم الأوردر / Order Number *</label>
                            <input
                                type="text"
                                {...register('orderNumber', { required: 'Order number is required' })}
                                placeholder="ORD-001"
                            />
                            {errors.orderNumber && <span className="error">{errors.orderNumber.message}</span>}
                        </div>

                        {/* Product Type */}
                        <div className="form-group">
                            <label>نوع المنتج / Product Type *</label>
                            <select
                                {...register('productType', { required: 'Product type is required' })}
                            >
                                <option value="">اختر نوع المنتج / Select Product Type</option>
                                {PRODUCT_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.nameAr} / {type.nameEn}
                                    </option>
                                ))}
                            </select>
                            {errors.productType && <span className="error">{errors.productType.message}</span>}
                        </div>

                        {/* Product Configuration Fields */}
                        {productTypeConfig && (
                            <div className="product-config-section">
                                <h4 className="section-title">{productTypeConfig.nameAr} / {productTypeConfig.nameEn}</h4>
                                {productTypeConfig.fields.map(field => renderField(field))}
                            </div>
                        )}

                        {/* Custom Fields */}
                        <CustomFieldsManager
                            fields={customFields}
                            onChange={setCustomFields}
                            userId={userId}
                            userRole={userRole}
                        />

                        {/* Order Details */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>الكمية / Quantity *</label>
                                <input
                                    type="number"
                                    {...register('quantity', {
                                        required: 'Quantity is required',
                                        min: { value: 1, message: 'Minimum quantity is 1' }
                                    })}
                                    placeholder="1000"
                                />
                                {errors.quantity && <span className="error">{errors.quantity.message}</span>}
                            </div>

                            <div className="form-group">
                                <label>تاريخ التسليم / Delivery Date *</label>
                                <input
                                    type="date"
                                    {...register('deliveryDate', { required: 'Delivery date is required' })}
                                />
                                {errors.deliveryDate && <span className="error">{errors.deliveryDate.message}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>ملاحظات / Notes</label>
                            <textarea
                                {...register('salesNotes')}
                                placeholder="أي ملاحظات إضافية..."
                                rows={4}
                            />
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        إلغاء / Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ التعديلات / Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditOrderModal;
