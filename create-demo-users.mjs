// Script to create demo employees for testing
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

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

const demoUsers = [
    {
        email: 'sales@printing.com',
        password: 'Sales@123',
        fullName: 'أحمد المبيعات',
        role: 'sales'
    },
    {
        email: 'design@printing.com',
        password: 'Design@123',
        fullName: 'سارة التصميم',
        role: 'design'
    },
    {
        email: 'production@printing.com',
        password: 'Production@123',
        fullName: 'محمد الإنتاج',
        role: 'production'
    }
];

async function createDemoEmployees() {
    console.log('🚀 Creating demo employees...\n');

    let created = 0;
    let existing = 0;

    for (const user of demoUsers) {
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
            const authUser = userCredential.user;

            // Create Firestore document
            await setDoc(doc(db, 'users', authUser.uid), {
                uid: authUser.uid,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                createdAt: Timestamp.now(),
                createdBy: 'system'
            });

            console.log(`✅ Created: ${user.fullName} (${user.role})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}\n`);
            created++;

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️  Already exists: ${user.fullName} (${user.role})`);
                console.log(`   Email: ${user.email}\n`);
                existing++;
            } else {
                console.error(`❌ Error creating ${user.fullName}:`, error.message, '\n');
            }
        }
    }

    console.log('═══════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════');
    console.log(`✅ Created: ${created}`);
    console.log(`⚠️  Already existed: ${existing}`);
    console.log(`📊 Total: ${demoUsers.length}`);
    console.log('');
    console.log('🎉 You can now login with any of these users!');
    console.log('🔄 Refresh the admin dashboard to see updated stats!');

    process.exit(0);
}

createDemoEmployees();
