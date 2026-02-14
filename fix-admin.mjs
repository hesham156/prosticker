// Script to add Firestore document for existing admin user
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAgLteACxfZxkQxwJYoNTNqdIg9UE5pGE4",
    authDomain: "aqar-b7d60.firebaseapp.com",
    projectId: "aqar-b7d60",
    storageBucket: "aqar-b7d60.firebasestorage.app",
    messagingSenderId: "376245419512",
    appId: "1:376245419512:web:dd3c3ebc47876164c06a0d",
    measurementId: "G-66QS2G2D9H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function fixAdminUser() {
    const email = 'admin@printing.com';
    const password = 'Admin@123456';

    try {
        console.log('🔄 Logging in as admin...');

        // Login to get the UID
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Logged in! UID:', user.uid);

        // Check if document already exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
            console.log('✅ User document already exists in Firestore!');
            console.log('   Data:', userDoc.data());
        } else {
            console.log('📝 Creating Firestore document...');

            // Create the document
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                fullName: 'System Admin',
                role: 'admin',
                createdAt: Timestamp.now(),
                createdBy: 'system'
            });

            console.log('✅ Firestore document created successfully!');
        }

        console.log('');
        console.log('═══════════════════════════════');
        console.log('  🎉 Admin user is ready!');
        console.log('═══════════════════════════════');
        console.log('Email:    ', email);
        console.log('Password: ', password);
        console.log('App URL:   http://localhost:5175/');
        console.log('');
        console.log('✅ You can now login!');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.code);
        console.error('   Message:', error.message);
        console.error('');

        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            console.log('⚠️  Wrong email or password');
        } else {
            console.log('⚠️  Please check Firebase Console and ensure:');
            console.log('1. Firestore database is created');
            console.log('2. Security rules allow writes');
        }

        process.exit(1);
    }
}

console.log('🔧 Fixing admin user data...');
console.log('');
fixAdminUser();
