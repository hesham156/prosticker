import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import OrderDetails from '../components/production/OrderDetails';
import ProductionQueue from '../components/production/ProductionQueue';
import { subscribeToOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import '../styles/Dashboard.css';

const ProductionDashboard: React.FC = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for all orders
        const unsubscribe = subscribeToOrders((orders) => {
            setAllOrders(orders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredOrders = allOrders.filter(order => {
        if (filter === 'all') return true;
        if (filter === 'pending') return order.status === 'pending-production';
        if (filter === 'in-progress') return order.status === 'in-production';
        if (filter === 'completed') return order.status === 'completed';
        return true;
    });

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>لوحة الإنتاج / Production Dashboard</h1>
                </div>

                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        الكل / All ({allOrders.length})
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        جاهز للإنتاج / Ready ({allOrders.filter(o => o.status === 'pending-production').length})
                    </button>
                    <button
                        className={filter === 'in-progress' ? 'active' : ''}
                        onClick={() => setFilter('in-progress')}
                    >
                        قيد الإنتاج / In Progress ({allOrders.filter(o => o.status === 'in-production').length})
                    </button>
                    <button
                        className={filter === 'completed' ? 'active' : ''}
                        onClick={() => setFilter('completed')}
                    >
                        مكتمل / Completed ({allOrders.filter(o => o.status === 'completed').length})
                    </button>
                </div>

                <div className="production-content">
                    {loading ? (
                        <div className="loading">جاري التحميل...</div>
                    ) : (
                        <ProductionQueue
                            orders={filteredOrders}
                            onSelectOrder={setSelectedOrder}
                        />
                    )}
                </div>

                {selectedOrder && (
                    <OrderDetails
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductionDashboard;
