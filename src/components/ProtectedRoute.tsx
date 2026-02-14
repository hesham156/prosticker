import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Array<'sales' | 'design' | 'production' | 'admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { currentUser, userData } = useAuth();

    if (!currentUser || !userData) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userData.role)) {
        // Redirect to user's appropriate dashboard
        return <Navigate to={`/${userData.role}`} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
