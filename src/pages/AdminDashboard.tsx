import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import AllOrdersView from '../components/admin/AllOrdersView';
import { fetchAllOrders } from '../services/orderService';
import { fetchAllEmployees } from '../services/userService';
import type { Order } from '../services/orderService';
import type { UserData } from '../services/authService';
import '../styles/Dashboard.css';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'orders'>('overview');
    const [orders, setOrders] = useState<Order[]>([]);
    const [employees, setEmployees] = useState<UserData[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allOrders, allEmployees] = await Promise.all([
                fetchAllOrders(),
                fetchAllEmployees()
            ]);
            setOrders(allOrders);
            setEmployees(allEmployees);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const stats = {
        totalOrders: orders.length,
        pendingDesign: orders.filter(o => o.status === 'pending-design').length,
        pendingProduction: orders.filter(o => o.status === 'pending-production').length,
        completed: orders.filter(o => o.status === 'completed').length,
        totalEmployees: employees.length,
        salesTeam: employees.filter(e => e.role === 'sales').length,
        designTeam: employees.filter(e => e.role === 'design').length,
        productionTeam: employees.filter(e => e.role === 'production').length
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة الإدارة / Admin Dashboard</h1>
                </div>

                <div className="admin-tabs">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        نظرة عامة / Overview
                    </button>
                    <button
                        className={activeTab === 'employees' ? 'active' : ''}
                        onClick={() => setActiveTab('employees')}
                    >
                        الموظفين / Employees
                    </button>
                    <button
                        className={activeTab === 'orders' ? 'active' : ''}
                        onClick={() => setActiveTab('orders')}
                    >
                        جميع الطلبات / All Orders
                    </button>
                </div>

                <div className="admin-content">
                    {activeTab === 'overview' && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>إجمالي الطلبات</h3>
                                <p className="stat-value">{stats.totalOrders}</p>
                                <p className="stat-label">Total Orders</p>
                            </div>
                            <div className="stat-card">
                                <h3>قيد التصميم</h3>
                                <p className="stat-value">{stats.pendingDesign}</p>
                                <p className="stat-label">Pending Design</p>
                            </div>
                            <div className="stat-card">
                                <h3>قيد الإنتاج</h3>
                                <p className="stat-value">{stats.pendingProduction}</p>
                                <p className="stat-label">Pending Production</p>
                            </div>
                            <div className="stat-card">
                                <h3>مكتمل</h3>
                                <p className="stat-value">{stats.completed}</p>
                                <p className="stat-label">Completed</p>
                            </div>
                            <div className="stat-card">
                                <h3>إجمالي الموظفين</h3>
                                <p className="stat-value">{stats.totalEmployees}</p>
                                <p className="stat-label">Total Employees</p>
                            </div>
                            <div className="stat-card">
                                <h3>قسم المبيعات</h3>
                                <p className="stat-value">{stats.salesTeam}</p>
                                <p className="stat-label">Sales Team</p>
                            </div>
                            <div className="stat-card">
                                <h3>قسم التصميم</h3>
                                <p className="stat-value">{stats.designTeam}</p>
                                <p className="stat-label">Design Team</p>
                            </div>
                            <div className="stat-card">
                                <h3>قسم الإنتاج</h3>
                                <p className="stat-value">{stats.productionTeam}</p>
                                <p className="stat-label">Production Team</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'employees' && (
                        <EmployeeManagement
                            employees={employees}
                            onUpdate={loadData}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <AllOrdersView orders={orders} onOrdersChange={loadData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
