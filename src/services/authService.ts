import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserData {
    uid: string;
    email: string;
    fullName: string;
    role: 'sales' | 'design' | 'production' | 'admin';
    createdAt: Date;
}

// Login with email and password
export const login = async (email: string, password: string): Promise<UserData> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            throw new Error('User data not found');
        }

        const userData = userDoc.data() as UserData;
        return userData;
    } catch (error: any) {
        throw new Error(error.message || 'Login failed');
    }
};

// Logout
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message || 'Logout failed');
    }
};

// Get current user with role
export const getCurrentUserData = async (user: User): Promise<UserData | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            return null;
        }

        return userDoc.data() as UserData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message || 'Password reset failed');
    }
};
