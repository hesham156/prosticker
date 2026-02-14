// Admin User Creation Script for aqar-b7d60 project
// Run with: node create-admin.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration for aqar-b7d60 project
const firebaseConfig = {
    apiKey: "AIzaSyAgLteACxfZxkQxwJYoNTNqdIg9UE5pGE4",
    authDomain: "aqar-b7d60.firebaseapp.com",
    projectId: "aqar-b7d60",
    storageBucket: "aqar-b7d60.firebasestorage.app",
    messagingSenderId: "376245419512",
    appId: "1:376245419512:web:dd3c3ebc47876164c06a0d",
    measurementId: "G-66QS2G2D9H"
};

console.log('🔧 Initializing Firebase (aqar-b7d60)...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = 'admin@printing.com';
const adminPassword = 'Admin@123456';

async function createAdmin() {
    try {
        console.log('🔄 Creating admin user...');
        console.log('Email:', adminEmail);

        // Step 1: Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;

        console.log('✅ Authentication user created!');
        console.log('   UID:', user.uid);

        // Step 2: Create Firestore document
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: adminEmail,
            fullName: 'System Admin',
            role: 'admin',
            createdAt: Timestamp.now(),
            createdBy: 'system'
        });

        console.log('✅ Firestore document created!');
        console.log('');
        console.log('═══════════════════════════════');
        console.log('  🎉 Admin created successfully!');
        console.log('═══════════════════════════════');
        console.log('Email:    ', adminEmail);
        console.log('Password: ', adminPassword);
        console.log('App URL:   http://localhost:5175/');
        console.log('');
        console.log('✅ You can now login to your app!');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.code);
        console.error('   Message:', error.message);
        console.error('');

        if (error.code === 'auth/email-already-in-use') {
            console.log('✅ Good news! Admin user already exists.');
            console.log('   You can login with:');
            console.log('   Email:', adminEmail);
            console.log('   Password:', adminPassword);
            console.log('   URL: http://localhost:5175/');
            process.exit(0);
        } else if (error.code === 'auth/operation-not-allowed') {
            console.log('⚠️  Authentication not enabled yet!');
            console.log('');
            console.log('📋 Quick steps to enable:');
            console.log('1. Go to: https://console.firebase.google.com/project/aqar-b7d60/authentication');
            console.log('2. Click "Get Started"');
            console.log('3. Enable "Email/Password"');
            console.log('4. Save and run: node create-admin.mjs');
            console.log('');
        } else {
            console.log('⚠️  Please check:');
            console.log('1. Firestore database is created in Firebase Console');
            console.log('2. Authentication is enabled');
            console.log('3. Internet connection is working');
        }

        process.exit(1);
    }
}

console.log('');
createAdmin();
