import React, { useState } from 'react';
import type { CustomField } from '../../services/orderService';
import { Timestamp } from 'firebase/firestore';
import '../../styles/CustomFields.css';

interface CustomFieldsManagerProps {
    fields: CustomField[];
    onChange: (fields: CustomField[]) => void;
    userId: string;
    userRole: 'sales' | 'design' | 'production' | 'admin';
}

const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
    fields,
    onChange,
    userId,
    userRole
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newField, setNewField] = useState({
        name: '',
        type: 'text' as CustomField['type'],
        value: '',
        options: ['']
    });

    const addField = () => {
        if (!newField.name.trim()) return;

        const customField: CustomField = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: newField.name,
            type: newField.type,
            value: newField.type === 'select' ? newField.options[0] : newField.value,
            options: newField.type === 'select' ? newField.options.filter(o => o.trim()) : undefined,
            addedBy: userId,
            addedByRole: userRole,
            addedAt: Timestamp.now()
        };

        onChange([...fields, customField]);

        // Reset form
        setNewField({
            name: '',
            type: 'text',
            value: '',
            options: ['']
        });
        setIsAdding(false);
    };

    const removeField = (id: string) => {
        onChange(fields.filter(f => f.id !== id));
    };

    const updateFieldValue = (id: string, value: any) => {
        onChange(fields.map(f => f.id === id ? { ...f, value } : f));
    };

    const addOption = () => {
        setNewField({
            ...newField,
            options: [...newField.options, '']
        });
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...newField.options];
        newOptions[index] = value;
        setNewField({ ...newField, options: newOptions });
    };

    const removeOption = (index: number) => {
        setNewField({
            ...newField,
            options: newField.options.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="custom-fields-manager">
            <div className="custom-fields-header">
                <h4>حقول مخصصة / Custom Fields</h4>
                {!isAdding && (
                    <button
                        type="button"
                        className="btn-add-field"
                        onClick={() => setIsAdding(true)}
                    >
                        + إضافة حقل / Add Field
                    </button>
                )}
            </div>

            {/* Existing Fields */}
            {fields.length > 0 && (
                <div className="existing-fields">
                    {fields.map((field) => (
                        <div key={field.id} className="custom-field-item">
                            <div className="field-info">
                                <label>{field.name}</label>
                                <span className="field-type-badge">{field.type}</span>
                            </div>

                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    value={field.value || ''}
                                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                    placeholder="Enter value..."
                                />
                            )}

                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    value={field.value || ''}
                                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                    placeholder="Enter number..."
                                />
                            )}

                            {field.type === 'date' && (
                                <input
                                    type="date"
                                    value={field.value || ''}
                                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                />
                            )}

                            {field.type === 'select' && field.options && (
                                <select
                                    value={field.value || ''}
                                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {field.options.map((option, idx) => (
                                        <option key={idx} value={option}>{option}</option>
                                    ))}
                                </select>
                            )}

                            <button
                                type="button"
                                className="btn-remove-field"
                                onClick={() => removeField(field.id)}
                                title="Remove field"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Field Form */}
            {isAdding && (
                <div className="add-field-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>اسم الحقل / Field Name *</label>
                            <input
                                type="text"
                                value={newField.name}
                                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                placeholder="مثال: رقم الفاتورة"
                            />
                        </div>

                        <div className="form-group">
                            <label>نوع الحقل / Field Type *</label>
                            <select
                                value={newField.type}
                                onChange={(e) => setNewField({
                                    ...newField,
                                    type: e.target.value as CustomField['type'],
                                    value: '',
                                    options: e.target.value === 'select' ? [''] : []
                                })}
                            >
                                <option value="text">نص / Text</option>
                                <option value="number">رقم / Number</option>
                                <option value="date">تاريخ / Date</option>
                                <option value="select">قائمة منسدلة / Dropdown</option>
                            </select>
                        </div>
                    </div>

                    {/* Options for Select Type */}
                    {newField.type === 'select' && (
                        <div className="select-options">
                            <label>الخيارات / Options</label>
                            {newField.options.map((option, index) => (
                                <div key={index} className="option-row">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    {newField.options.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="btn-remove-option"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addOption}
                                className="btn-add-option"
                            >
                                + Add Option
                            </button>
                        </div>
                    )}

                    {/* Initial Value (for non-select types) */}
                    {newField.type !== 'select' && (
                        <div className="form-group">
                            <label>القيمة / Value</label>
                            {newField.type === 'text' && (
                                <input
                                    type="text"
                                    value={newField.value}
                                    onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                                    placeholder="Enter initial value (optional)"
                                />
                            )}
                            {newField.type === 'number' && (
                                <input
                                    type="number"
                                    value={newField.value}
                                    onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                                    placeholder="Enter initial value (optional)"
                                />
                            )}
                            {newField.type === 'date' && (
                                <input
                                    type="date"
                                    value={newField.value}
                                    onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                                />
                            )}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setNewField({ name: '', type: 'text', value: '', options: [''] });
                            }}
                            className="btn-cancel"
                        >
                            إلغاء / Cancel
                        </button>
                        <button
                            type="button"
                            onClick={addField}
                            className="btn-save"
                            disabled={!newField.name.trim()}
                        >
                            حفظ الحقل / Save Field
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomFieldsManager;
