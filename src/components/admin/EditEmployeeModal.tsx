import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateEmployee } from '../../services/userService';
import type { UserData } from '../../services/authService';
import '../../styles/Modal.css';

interface EditEmployeeForm {
    fullName: string;
    role: UserData['role'];
    mondayBoardId?: string;
}

interface EditEmployeeModalProps {
    employee: UserData;
    onClose: () => void;
    onSuccess: () => void;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, onClose, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<EditEmployeeForm>({
        defaultValues: {
            fullName: employee.fullName,
            role: employee.role,
            mondayBoardId: employee.mondayBoardId || ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: EditEmployeeForm) => {
        try {
            setLoading(true);
            setError('');

            await updateEmployee(employee.uid, {
                fullName: data.fullName,
                role: data.role,
                mondayBoardId: data.mondayBoardId || undefined
            });

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'فشل تحديث الموظف / Failed to update employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>تعديل بيانات الموظف / Edit Employee</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>البريد الإلكتروني / Email</label>
                        <input
                            type="email"
                            value={employee.email}
                            disabled
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                        <small className="help-text">لا يمكن تعديل البريد الإلكتروني / Email cannot be changed</small>
                    </div>

                    <div className="form-group">
                        <label>الاسم الكامل / Full Name *</label>
                        <input
                            type="text"
                            {...register('fullName', { required: 'Full name is required' })}
                            placeholder="أحمد محمد"
                        />
                        {errors.fullName && <span className="error">{errors.fullName.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>الدور / Role *</label>
                        <select {...register('role', { required: 'Role is required' })}>
                            <option value="sales">مبيعات / Sales</option>
                            <option value="design">تصميم / Design</option>
                            <option value="production">إنتاج / Production</option>
                            <option value="admin">إدارة / Admin</option>
                        </select>
                        {errors.role && <span className="error">{errors.role.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>رقم Board في Monday / Monday Board ID</label>
                        <input
                            type="text"
                            {...register('mondayBoardId')}
                            placeholder="18396347159"
                        />
                        <small className="help-text">اختياري / Optional</small>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            إلغاء / Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'جاري التحديث...' : 'تحديث / Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
