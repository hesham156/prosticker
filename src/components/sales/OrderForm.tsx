import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder } from '../../services/orderService';
import type { CustomField } from '../../services/orderService';
import { PRODUCT_TYPES, getProductTypeById, shouldShowField } from '../../config/productTypes';
import type { ProductField } from '../../config/productTypes';
import CustomFieldsManager from '../common/CustomFieldsManager';
import '../../styles/Forms.css';

interface OrderFormData {
    orderNumber: string;
    productType: string;
    quantity: number;
    deliveryDate: string;
    salesNotes: string;
    [key: string]: any; // For dynamic product config fields
}

interface OrderFormProps {
    onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess }) => {
    const { userData } = useAuth();
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<OrderFormData>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    const selectedProductType = watch('productType');
    const productTypeConfig = getProductTypeById(selectedProductType);
    const formValues = watch();

    const renderField = (field: ProductField) => {
        // Check if field should be shown based on dependencies
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
        if (!userData?.uid) return;

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

            // Create order with product configuration and custom fields
            await createOrder({
                orderNumber: data.orderNumber,
                orderType: productTypeConfig?.nameEn || 'Custom', // Legacy field
                productType: data.productType,
                productConfig: productConfig,
                quantity: Number(data.quantity),
                deliveryDate: data.deliveryDate,
                salesNotes: data.salesNotes || '',
                customFields: customFields.length > 0 ? customFields : []
            }, userData.uid);

            reset();
            setCustomFields([]);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="order-form">
            <h3>طلب جديد / New Order</h3>

            {error && <div className="error-message">{error}</div>}

            {/* Order Number */}
            <div className="form-section">
                <h4>رقم الأوردر / Order Number</h4>
                <div className="form-group">
                    <label>رقم الأوردر / Order Number *</label>
                    <input
                        type="text"
                        {...register('orderNumber', { required: 'Order number is required' })}
                        placeholder="ORD-001"
                    />
                    {errors.orderNumber && <span className="error">{errors.orderNumber.message}</span>}
                </div>
            </div>

            {/* Product Type Selection */}
            <div className="form-section">
                <h4>نوع المنتج / Product Type</h4>
                <div className="form-group">
                    <label>اختر نوع المنتج / Select Product Type *</label>
                    <select {...register('productType', { required: 'Product type is required' })}>
                        <option value="">اختر نوع المنتج / Select Product Type</option>
                        {PRODUCT_TYPES.map(pt => (
                            <option key={pt.id} value={pt.id}>
                                {pt.nameAr} / {pt.nameEn}
                            </option>
                        ))}
                    </select>
                    {errors.productType && <span className="error">{errors.productType.message}</span>}
                </div>
            </div>

            {/* Product Configuration Fields */}
            {productTypeConfig && (
                <div className="product-config-section">
                    <h4 className="section-title">{productTypeConfig.nameAr} / {productTypeConfig.nameEn}</h4>
                    {productTypeConfig.fields.map(field => renderField(field))}
                </div>
            )}

            {/* Custom Fields */}
            {userData && (
                <CustomFieldsManager
                    fields={customFields}
                    onChange={setCustomFields}
                    userId={userData.uid}
                    userRole="sales"
                />
            )}

            {/* Sales Notes */}

            {/* Order Details */}
            <div className="form-section">
                <h4>تفاصيل الطلب / Order Details</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>الكمية / Quantity *</label>
                        <input
                            type="number"
                            {...register('quantity', { required: 'Quantity is required', min: 1 })}
                            placeholder="1000"
                            min="1"
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
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'جاري الإرسال...' : 'إرسال للتصميم / Send to Design'}
            </button>
        </form>
    );
};

export default OrderForm;
