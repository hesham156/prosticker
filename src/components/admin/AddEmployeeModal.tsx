import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { createEmployee } from '../../services/userService';
import type { UserData } from '../../services/authService';
import '../../styles/Modal.css';

interface AddEmployeeForm {
    fullName: string;
    email: string;
    password: string;
    role: UserData['role'];
}

interface AddEmployeeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onSuccess }) => {
    const { userData } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<AddEmployeeForm>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: AddEmployeeForm) => {
        if (!userData?.uid) return;

        try {
            setLoading(true);
            setError('');

            await createEmployee(
                data.email,
                data.password,
                data.fullName,
                data.role,
                userData.uid
            );

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'فشل إضافة الموظف / Failed to add employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>إضافة موظف جديد / Add New Employee</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    {error && <div className="error-message">{error}</div>}

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
                        <label>البريد الإلكتروني / Email *</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            placeholder="employee@example.com"
                        />
                        {errors.email && <span className="error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>كلمة المرور / Password *</label>
                        <input
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                }
                            })}
                            placeholder="••••••••"
                        />
                        {errors.password && <span className="error">{errors.password.message}</span>}
                        <small className="help-text">كحد أدنى 6 أحرف / Minimum 6 characters</small>
                    </div>

                    <div className="form-group">
                        <label>الدور / Role *</label>
                        <select {...register('role', { required: 'Role is required' })}>
                            <option value="">اختر الدور / Select Role</option>
                            <option value="sales">مبيعات / Sales</option>
                            <option value="design">تصميم / Design</option>
                            <option value="production">إنتاج / Production</option>
                            <option value="admin">إدارة / Admin</option>
                        </select>
                        {errors.role && <span className="error">{errors.role.message}</span>}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            إلغاء / Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'جاري الإضافة...' : 'إضافة / Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
