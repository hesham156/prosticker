// Product Type Definitions for the Printing Management System

export interface ProductFieldOption {
    value: string;
    labelAr: string;
    labelEn: string;
}

export interface ProductField {
    id: string;
    type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
    labelAr: string;
    labelEn: string;
    required: boolean;
    options?: ProductFieldOption[];
    dependsOn?: {
        fieldId: string;
        value: string | string[];
    };
    placeholder?: string;
    unit?: string; // e.g., "cm", "mm"
}

export interface ProductType {
    id: string;
    nameAr: string;
    nameEn: string;
    fields: ProductField[];
}

export const PRODUCT_TYPES: ProductType[] = [
    // الاحزمة - Belts
    {
        id: 'belts',
        nameAr: 'الاحزمة',
        nameEn: 'Belts',
        fields: [
            {
                id: 'belt_type',
                type: 'select',
                labelAr: 'نوع الحزام',
                labelEn: 'Belt Type',
                required: true,
                options: [
                    { value: 'cups', labelAr: 'أكواب', labelEn: 'Cups' },
                    { value: 'light_paper', labelAr: 'ورقي خفيف', labelEn: 'Light Paper' }
                ]
            },
            // Cup-specific fields
            {
                id: 'paper_size',
                type: 'select',
                labelAr: 'حجم الورق',
                labelEn: 'Paper Size',
                required: true,
                dependsOn: {
                    fieldId: 'belt_type',
                    value: 'cups'
                },
                options: [
                    { value: '250', labelAr: '250', labelEn: '250' },
                    { value: '300', labelAr: '300', labelEn: '300' }
                ]
            },
            // Light Paper-specific fields
            {
                id: 'belt_length_type',
                type: 'select',
                labelAr: 'طول الحزام',
                labelEn: 'Belt Length',
                required: true,
                dependsOn: {
                    fieldId: 'belt_type',
                    value: 'light_paper'
                },
                options: [
                    { value: 'short_30x45', labelAr: 'قصير (30×45)', labelEn: 'Short (30×45)' },
                    { value: 'long', labelAr: 'طويل', labelEn: 'Long' }
                ]
            },
            {
                id: 'adhesive',
                type: 'select',
                labelAr: 'اللاصق',
                labelEn: 'Adhesive',
                required: true,
                dependsOn: {
                    fieldId: 'belt_type',
                    value: 'light_paper'
                },
                options: [
                    { value: 'with', labelAr: 'مع', labelEn: 'With' },
                    { value: 'without', labelAr: 'بدون', labelEn: 'Without' }
                ]
            },
            {
                id: 'adhesive_location',
                type: 'select',
                labelAr: 'مكان اللاصق',
                labelEn: 'Adhesive Location',
                required: true,
                dependsOn: {
                    fieldId: 'adhesive',
                    value: 'with'
                },
                options: [
                    { value: 'inside', labelAr: 'داخل المقاس', labelEn: 'Inside Size' },
                    { value: 'outside', labelAr: 'خارج المقاس', labelEn: 'Outside Size' }
                ]
            },
            // Common belt fields
            {
                id: 'belt_length',
                type: 'number',
                labelAr: 'الطول',
                labelEn: 'Length',
                required: true,
                unit: 'cm'
            },
            {
                id: 'belt_width',
                type: 'number',
                labelAr: 'العرض',
                labelEn: 'Width',
                required: true,
                unit: 'cm'
            }
        ]
    },

    // الشرايط - Ribbons
    {
        id: 'ribbons',
        nameAr: 'الشرايط',
        nameEn: 'Ribbons',
        fields: [
            {
                id: 'ribbon_type',
                type: 'select',
                labelAr: 'نوع الشريط',
                labelEn: 'Ribbon Type',
                required: true,
                options: [
                    { value: 'satin', labelAr: 'ستان', labelEn: 'Satin' },
                    { value: 'fabric', labelAr: 'قماش', labelEn: 'Fabric' }
                ]
            },
            {
                id: 'ribbon_size',
                type: 'select',
                labelAr: 'المقاس',
                labelEn: 'Size',
                required: true,
                options: [
                    { value: 'narrow', labelAr: 'نحيف', labelEn: 'Narrow' },
                    { value: 'normal', labelAr: 'عادي', labelEn: 'Normal' },
                    { value: 'wide', labelAr: 'عريض', labelEn: 'Wide' }
                ]
            },
            {
                id: 'ribbon_color',
                type: 'select',
                labelAr: 'اللون',
                labelEn: 'Color',
                required: true,
                options: [
                    { value: 'white', labelAr: 'ابيض', labelEn: 'White' },
                    { value: 'colored', labelAr: 'ملون', labelEn: 'Colored' }
                ]
            }
        ]
    }
];

// Utility function to get product type by ID
export const getProductTypeById = (id: string): ProductType | undefined => {
    return PRODUCT_TYPES.find(pt => pt.id === id);
};

// Utility function to check if a field should be displayed based on dependencies
export const shouldShowField = (field: ProductField, formValues: Record<string, any>): boolean => {
    if (!field.dependsOn) return true;

    const dependencyValue = formValues[field.dependsOn.fieldId];

    if (Array.isArray(field.dependsOn.value)) {
        return field.dependsOn.value.includes(dependencyValue);
    }

    return dependencyValue === field.dependsOn.value;
};
