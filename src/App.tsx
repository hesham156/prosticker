import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SalesDashboard from './pages/SalesDashboard';
import DesignDashboard from './pages/DesignDashboard';
import ProductionDashboard from './pages/ProductionDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/main.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/sales"
            element={
              <ProtectedRoute allowedRoles={['sales']}>
                <SalesDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/design"
            element={
              <ProtectedRoute allowedRoles={['design']}>
                <DesignDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/production"
            element={
              <ProtectedRoute allowedRoles={['production']}>
                <ProductionDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
