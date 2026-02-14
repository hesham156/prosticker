import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCurrentUserData, login as loginService, logout as logoutService } from '../services/authService';
import type { UserData } from '../services/authService';

interface AuthContextType {
    currentUser: User | null;
    userData: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserData>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                const data = await getCurrentUserData(user);
                setUserData(data);
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string): Promise<UserData> => {
        const userData = await loginService(email, password);
        setUserData(userData);
        return userData;
    };

    const logout = async (): Promise<void> => {
        await logoutService();
        setUserData(null);
    };

    const value: AuthContextType = {
        currentUser,
        userData,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
