import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder, createSubItem, findOrderByNumber } from '../../services/orderService';
import type { Order, CustomField } from '../../services/orderService';
import { fetchDesigners } from '../../services/userService';
import type { UserData } from '../../services/authService';
import { PRODUCT_TYPES, getProductTypeById, shouldShowField } from '../../config/productTypes';
import type { ProductField } from '../../config/productTypes';
import CustomFieldsManager from '../common/CustomFieldsManager';
import SearchableSelect from '../common/SearchableSelect';
import '../../styles/Forms.css';

interface OrderFormData {
    orderNumber: string;
    productType: string;
    quantity: number;
    deliveryDate: string;
    salesNotes: string;
    assignedDesignerId: string;
    modifications: string;
    [key: string]: any;
}

interface OrderFormProps {
    onSuccess: () => void;
}

type OrderMode = 'new' | 'previous';

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess }) => {
    const { userData } = useAuth();
    const { register, handleSubmit, formState: { errors }, reset, watch, control } = useForm<OrderFormData>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [designers, setDesigners] = useState<UserData[]>([]);
    const [mode, setMode] = useState<OrderMode>('new');
    const [fileLinks, setFileLinks] = useState<string[]>([]);
    const [newLinkInput, setNewLinkInput] = useState('');
    const [existingOrder, setExistingOrder] = useState<Order | null>(null);
    const [searchingOrder, setSearchingOrder] = useState(false);
    const [searchOrderNumber, setSearchOrderNumber] = useState('');

    useEffect(() => {
        const loadDesigners = async () => {
            try {
                const designersList = await fetchDesigners();
                setDesigners(designersList);
            } catch (err) {
                console.error('Failed to fetch designers:', err);
            }
        };
        loadDesigners();
    }, []);

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

    // Handle searching for existing order
    const handleSearchOrder = async () => {
        if (!searchOrderNumber.trim()) return;
        setSearchingOrder(true);
        setError('');
        try {
            const found = await findOrderByNumber(searchOrderNumber.trim());
            if (found) {
                setExistingOrder(found);
            } else {
                setError('لم يتم العثور على الأوردر / Order not found');
                setExistingOrder(null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSearchingOrder(false);
        }
    };

    // Add a file link
    const handleAddLink = () => {
        const trimmed = newLinkInput.trim();
        if (trimmed && !fileLinks.includes(trimmed)) {
            setFileLinks([...fileLinks, trimmed]);
            setNewLinkInput('');
        }
    };

    // Remove a file link
    const handleRemoveLink = (index: number) => {
        setFileLinks(fileLinks.filter((_, i) => i !== index));
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

            if (mode === 'previous' && existingOrder?.id) {
                // Add sub-item to existing order
                await createSubItem(existingOrder.id, {
                    productType: data.productType,
                    productConfig,
                    quantity: Number(data.quantity),
                    salesNotes: data.salesNotes || '',
                    modifications: data.modifications || '',
                    fileLinks: fileLinks.length > 0 ? fileLinks : undefined
                }, userData.uid);
            } else {
                // Create new parent order
                const selectedDesigner = designers.find(d => d.uid === data.assignedDesignerId);

                const orderId = await createOrder({
                    orderNumber: data.orderNumber,
                    orderType: productTypeConfig?.nameEn || 'Custom',
                    productType: data.productType,
                    productConfig,
                    quantity: Number(data.quantity),
                    deliveryDate: data.deliveryDate,
                    salesNotes: data.salesNotes || '',
                    assignedDesignerId: data.assignedDesignerId || undefined,
                    assignedDesignerName: selectedDesigner?.fullName || undefined,
                    customFields: customFields.length > 0 ? customFields : []
                }, userData.uid);

                // If file links or modifications are provided, also create a sub-item
                if (fileLinks.length > 0 || data.modifications) {
                    await createSubItem(orderId, {
                        productType: data.productType,
                        productConfig,
                        quantity: Number(data.quantity),
                        modifications: data.modifications || '',
                        fileLinks: fileLinks.length > 0 ? fileLinks : undefined
                    }, userData.uid);
                }
            }

            reset();
            setCustomFields([]);
            setFileLinks([]);
            setNewLinkInput('');
            setExistingOrder(null);
            setSearchOrderNumber('');
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Reset form when switching modes
    const handleModeChange = (newMode: OrderMode) => {
        setMode(newMode);
        reset();
        setError('');
        setExistingOrder(null);
        setSearchOrderNumber('');
        setFileLinks([]);
        setNewLinkInput('');
        setCustomFields([]);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="order-form">
            {/* Mode Toggle */}
            <div className="order-mode-toggle">
                <button
                    type="button"
                    className={`mode-btn ${mode === 'new' ? 'active' : ''}`}
                    onClick={() => handleModeChange('new')}
                >
                    🆕 طلب جديد / New Order
                </button>
                <button
                    type="button"
                    className={`mode-btn ${mode === 'previous' ? 'active' : ''}`}
                    onClick={() => handleModeChange('previous')}
                >
                    🔗 طلب سابق / Previous Order
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Previous Order: Search */}
            {mode === 'previous' && (
                <div className="form-section previous-order-section">
                    <h4>🔍 البحث عن أوردر سابق / Search Existing Order</h4>
                    <div className="search-order-row">
                        <input
                            type="text"
                            value={searchOrderNumber}
                            onChange={(e) => setSearchOrderNumber(e.target.value)}
                            placeholder="أدخل رقم الأوردر / Enter Order Number"
                            className="search-order-input"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchOrder(); } }}
                        />
                        <button
                            type="button"
                            className="btn-search-order"
                            onClick={handleSearchOrder}
                            disabled={searchingOrder}
                        >
                            {searchingOrder ? '...' : '🔍 بحث'}
                        </button>
                    </div>

                    {existingOrder && (
                        <div className="found-order-card">
                            <div className="found-order-info">
                                <span className="found-order-number">#{existingOrder.orderNumber}</span>
                                <span className="found-order-type">{existingOrder.productType || existingOrder.orderType}</span>
                                <span className="found-order-status">
                                    {existingOrder.subitemsCount
                                        ? `${existingOrder.subitemsCount} عناصر فرعية`
                                        : 'بدون عناصر فرعية'}
                                </span>
                            </div>
                            <span className="found-order-check">✅ تم العثور</span>
                        </div>
                    )}
                </div>
            )}

            {/* New Order: Order Number & Designer */}
            {mode === 'new' && (
                <div className="form-section">
                    <h4>رقم الأوردر / Order Number</h4>
                    <div className="form-group">
                        <label>رقم الأوردر / Order Number *</label>
                        <input
                            type="text"
                            {...register('orderNumber', { required: mode === 'new' ? 'Order number is required' : false })}
                            placeholder="ORD-001"
                        />
                        {errors.orderNumber && <span className="error">{errors.orderNumber.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>المصمم المسؤول / Assigned Designer</label>
                        <select {...register('assignedDesignerId')}>
                            <option value="">بدون تحديد / Not Assigned</option>
                            {designers.map(designer => (
                                <option key={designer.uid} value={designer.uid}>
                                    {designer.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Product Type Selection (both modes) */}
            {(mode === 'new' || (mode === 'previous' && existingOrder)) && (
                <>
                    <div className="form-section">
                        <h4>نوع المنتج / Product Type</h4>
                        <Controller
                            name="productType"
                            control={control}
                            rules={{ required: 'Product type is required' }}
                            render={({ field }) => (
                                <SearchableSelect
                                    options={PRODUCT_TYPES.map(pt => ({
                                        value: pt.id,
                                        labelAr: pt.nameAr,
                                        labelEn: pt.nameEn
                                    }))}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="اختر نوع المنتج / Select Product Type"
                                    label="اختر نوع المنتج / Select Product Type"
                                    error={errors.productType?.message as string}
                                    required
                                />
                            )}
                        />
                    </div>

                    {/* Product Configuration Fields */}
                    {productTypeConfig && (
                        <div className="product-config-section">
                            <h4 className="section-title">{productTypeConfig.nameAr} / {productTypeConfig.nameEn}</h4>
                            {productTypeConfig.fields.map(field => renderField(field))}
                        </div>
                    )}

                    {/* Custom Fields (new orders only) */}
                    {mode === 'new' && userData && (
                        <CustomFieldsManager
                            fields={customFields}
                            onChange={setCustomFields}
                            userId={userData.uid}
                            userRole="sales"
                        />
                    )}

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

                            {mode === 'new' && (
                                <div className="form-group">
                                    <label>تاريخ التسليم / Delivery Date *</label>
                                    <input
                                        type="date"
                                        {...register('deliveryDate', { required: mode === 'new' ? 'Delivery date is required' : false })}
                                    />
                                    {errors.deliveryDate && <span className="error">{errors.deliveryDate.message}</span>}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>ملاحظات / Notes</label>
                            <textarea
                                {...register('salesNotes')}
                                placeholder="أي ملاحظات إضافية..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Modifications & File Links Section */}
                    <div className="form-section">
                        <h4>📝 تعديلات وروابط الملفات / Modifications & File Links</h4>

                        <div className="form-group">
                            <label>التعديلات المطلوبة / Modifications</label>
                            <textarea
                                {...register('modifications')}
                                placeholder="اكتب التعديلات المطلوبة هنا..."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label>روابط الملفات / File Links</label>
                            <div className="file-links-input-row">
                                <input
                                    type="url"
                                    value={newLinkInput}
                                    onChange={(e) => setNewLinkInput(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="file-link-input"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
                                />
                                <button
                                    type="button"
                                    className="btn-add-link"
                                    onClick={handleAddLink}
                                    disabled={!newLinkInput.trim()}
                                >
                                    + إضافة
                                </button>
                            </div>

                            {fileLinks.length > 0 && (
                                <div className="file-links-list">
                                    {fileLinks.map((link, index) => (
                                        <div key={index} className="file-link-item">
                                            <a href={link} target="_blank" rel="noopener noreferrer" className="file-link-url">
                                                🔗 {link.length > 50 ? link.substring(0, 50) + '...' : link}
                                            </a>
                                            <button
                                                type="button"
                                                className="btn-remove-link"
                                                onClick={() => handleRemoveLink(index)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading || (mode === 'previous' && !existingOrder)}>
                        {loading
                            ? 'جاري الإرسال...'
                            : mode === 'previous'
                                ? '➕ إضافة عنصر فرعي / Add Sub-item'
                                : 'إرسال للتصميم / Send to Design'
                        }
                    </button>
                </>
            )}
        </form>
    );
};

export default OrderForm;
