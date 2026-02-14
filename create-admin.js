// Simple script to create admin user
// Make sure Authentication is enabled in Firebase Console first!

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBQFgdOGFVrKOWaTl6FDV36C0j-39x5O8I",
    authDomain: "system-2e5f7.firebaseapp.com",
    projectId: "system-2e5f7",
    storageBucket: "system-2e5f7.firebasestorage.app",
    messagingSenderId: "372172308688",
    appId: "1:372172308688:web:15c09c5f28f4be68f99c76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
    const email = 'admin@printing.com';
    const password = 'Admin@123456';

    try {
        console.log('🔄 Creating admin user...');

        // Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Auth user created! UID:', user.uid);

        // Create Firestore user document
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            fullName: 'System Admin',
            role: 'admin',
            createdAt: Timestamp.now(),
            createdBy: 'system'
        });

        console.log('✅ Firestore document created!');
        console.log('');
        console.log('========================');
        console.log('Admin user ready! 🎉');
        console.log('========================');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('');
        console.log('You can now login at: http://localhost:5173/');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.code === 'auth/email-already-in-use') {
            console.log('⚠️  User already exists! You can login directly.');
        } else if (error.code === 'auth/operation-not-allowed') {
            console.log('⚠️  Please enable Email/Password authentication in Firebase Console:');
            console.log('   Build → Authentication → Sign-in method → Email/Password');
        }

        process.exit(1);
    }
}

createAdmin();
