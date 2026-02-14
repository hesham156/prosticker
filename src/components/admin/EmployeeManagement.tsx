import React, { useState } from 'react';
import type { UserData } from '../../services/authService';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { deleteEmployee } from '../../services/userService';
import '../../styles/AdminComponents.css';

interface EmployeeManagementProps {
    employees: UserData[];
    onUpdate: () => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onUpdate }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<UserData | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            sales: 'مبيعات / Sales',
            design: 'تصميم / Design',
            production: 'إنتاج / Production',
            admin: 'إدارة / Admin'
        };
        return labels[role] || role;
    };

    const handleDelete = async (uid: string, name: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف ${name}؟\nAre you sure you want to delete ${name}?`)) {
            return;
        }

        try {
            setDeletingId(uid);
            await deleteEmployee(uid);
            onUpdate();
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('فشل حذف الموظف / Failed to delete employee');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate) {
            return date.toDate().toLocaleDateString('ar-EG');
        }
        return new Date(date).toLocaleDateString('ar-EG');
    };

    return (
        <div className="employee-management">
            <div className="section-header">
                <h2>إدارة الموظفين / Employee Management</h2>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    + إضافة موظف / Add Employee
                </button>
            </div>

            <div className="employees-table">
                <table>
                    <thead>
                        <tr>
                            <th>الاسم / Name</th>
                            <th>البريد / Email</th>
                            <th>الدور / Role</th>
                            <th>تاريخ الإضافة / Created</th>
                            <th>إجراءات / Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.uid}>
                                <td>{employee.fullName}</td>
                                <td>{employee.email}</td>
                                <td>
                                    <span className={`role-badge role-${employee.role}`}>
                                        {getRoleLabel(employee.role)}
                                    </span>
                                </td>
                                <td>{formatDate(employee.createdAt)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-edit"
                                            onClick={() => setEditingEmployee(employee)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            تعديل / Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(employee.uid, employee.fullName)}
                                            disabled={deletingId === employee.uid}
                                        >
                                            {deletingId === employee.uid ? 'حذف...' : 'حذف / Delete'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {employees.length === 0 && (
                    <div className="empty-state">
                        <p>لا يوجد موظفين</p>
                        <p>No employees</p>
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        onUpdate();
                    }}
                />
            )}

            {editingEmployee && (
                <EditEmployeeModal
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSuccess={() => {
                        setEditingEmployee(null);
                        onUpdate();
                    }}
                />
            )}
        </div>
    );
};

export default EmployeeManagement;
