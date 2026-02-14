import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import '../../styles/Navbar.css';

const Navbar: React.FC = () => {
    const { userData, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            sales: 'مبيعات / Sales',
            design: 'تصميم / Design',
            production: 'إنتاج / Production',
            admin: 'إدارة / Admin'
        };
        return labels[role] || role;
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={logo} alt="Logo" className="navbar-logo" />
                <h2>نظام المطبعة</h2>
            </div>

            <div className="navbar-user">
                <div className="user-info">
                    <span className="user-name">{userData?.fullName}</span>
                    <span className="user-role">{userData && getRoleLabel(userData.role)}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    تسجيل خروج / Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
