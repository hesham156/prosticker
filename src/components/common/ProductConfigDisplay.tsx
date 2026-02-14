import React from 'react';
import { getProductTypeById } from '../../config/productTypes';
import type { Order } from '../../services/orderService';

interface ProductConfigDisplayProps {
    order: Order;
    compact?: boolean; // Add compact mode option
}

const ProductConfigDisplay: React.FC<ProductConfigDisplayProps> = ({ order, compact = true }) => {
    // Handle legacy orders that don't have productType
    if (!order.productType || !order.productConfig) {
        return (
            <div className="product-config-display">
                <div className="config-item">
                    <span className="config-label">Type:</span>
                    <span className="config-value">{order.orderType}</span>
                </div>
            </div>
        );
    }

    const productType = getProductTypeById(order.productType);

    if (!productType) {
        return (
            <div className="product-config-display">
                <div className="config-item">
                    <span className="config-label">Type:</span>
                    <span className="config-value">{order.productType}</span>
                </div>
            </div>
        );
    }

    // Get field labels and values
    const configItems = productType.fields
        .filter(field => order.productConfig![field.id] !== undefined && order.productConfig![field.id] !== '')
        .map(field => {
            const value = order.productConfig![field.id];
            let displayValue = value;

            // If field has options, find the matching option label
            if (field.options) {
                const option = field.options.find(opt => opt.value === value);
                if (option) {
                    displayValue = compact ? option.labelAr : `${option.labelAr} / ${option.labelEn}`;
                }
            }

            // Add unit if available
            if (field.unit && typeof value === 'number') {
                displayValue = `${value}${field.unit}`;
            }

            return {
                label: compact ? field.labelAr : `${field.labelAr} / ${field.labelEn}`,
                value: displayValue
            };
        });

    // Compact view with badges
    if (compact) {
        return (
            <div className="product-config-compact">
                <div className="config-title">
                    {productType.nameAr}
                </div>
                <div className="config-items">
                    {configItems.map((item, index) => (
                        <span key={index} className="config-item" title={item.label}>
                            {item.value}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    // Full view (for modals, etc.)
    return (
        <div className="product-config-display">
            <div className="config-item product-type">
                <span className="config-label">نوع المنتج / Product Type:</span>
                <span className="config-value">{productType.nameAr} / {productType.nameEn}</span>
            </div>
            {configItems.map((item, index) => (
                <div key={index} className="config-item">
                    <span className="config-label">{item.label}:</span>
                    <span className="config-value">{item.value}</span>
                </div>
            ))}
        </div>
    );
};

export default ProductConfigDisplay;
