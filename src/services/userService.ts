import {
    createUserWithEmailAndPassword
} from 'firebase/auth';
import {
    collection,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    Timestamp,
    query,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserData } from './authService';

// Create employee (Admin only)
export const createEmployee = async (
    email: string,
    password: string,
    fullName: string,
    role: UserData['role'],
    adminId: string
): Promise<string> => {
    try {
        // Create Firebase auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore with UID as document ID
        const userData: UserData & { createdBy: string } = {
            uid: user.uid,
            email,
            fullName,
            role,
            createdAt: Timestamp.now() as any,
            createdBy: adminId
        };

        // Use setDoc with user.uid as document ID instead of addDoc
        await setDoc(doc(db, 'users', user.uid), userData);

        return user.uid;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create employee');
    }
};

// Update user role
export const updateUserRole = async (
    userId: string,
    role: UserData['role']
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update user role');
    }
};

// Fetch all employees
export const fetchAllEmployees = async (): Promise<UserData[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const employees: UserData[] = [];

        querySnapshot.forEach((doc) => {
            employees.push(doc.data() as UserData);
        });

        return employees;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch employees');
    }
};

// Delete employee
export const deleteEmployee = async (uid: string): Promise<void> => {
    try {
        // Find and delete user document
        const q = query(collection(db, 'users'), where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (docSnapshot) => {
            await deleteDoc(doc(db, 'users', docSnapshot.id));
        });

        // Note: Deleting from Firebase Auth requires admin SDK on backend
        // For now, we just delete from Firestore
        // In production, you'd implement a Cloud Function for this
    } catch (error: any) {
        throw new Error(error.message || 'Failed to delete employee');
    }
};
