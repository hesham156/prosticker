import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import OrderForm from '../components/sales/OrderForm';
import OrderList from '../components/sales/OrderList';
import { fetchOrdersByUser } from '../services/orderService';
import type { Order } from '../services/orderService';
import '../styles/Dashboard.css';

const SalesDashboard: React.FC = () => {
    const { userData } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        if (userData?.uid) {
            try {
                const userOrders = await fetchOrdersByUser(userData.uid);
                setOrders(userOrders);
            } catch (error) {
                console.error('Error loading orders:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOrderCreated = () => {
        setShowForm(false);
        loadOrders();
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة المبيعات / Sales Dashboard</h1>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'إلغاء / Cancel' : 'طلب جديد / New Order'}
                    </button>
                </div>

                {showForm && (
                    <div className="form-section">
                        <OrderForm onSuccess={handleOrderCreated} />
                    </div>
                )}

                <div className="orders-section">
                    <h2>طلباتي / My Orders</h2>
                    {loading ? (
                        <div className="loading">جاري التحميل...</div>
                    ) : (
                        <OrderList orders={orders} onOrdersChange={loadOrders} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
