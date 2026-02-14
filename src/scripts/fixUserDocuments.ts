// Fix User Documents Script
// This script migrates user documents from random IDs to UID-based IDs

import { db } from './config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

async function fixUserDocuments() {
    console.log('🔧 Starting user documents migration...');

    try {
        // Get all user documents
        const usersSnapshot = await getDocs(collection(db, 'users'));

        console.log(`📋 Found ${usersSnapshot.size} user documents`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const currentDocId = userDoc.id;
            const correctDocId = userData.uid;

            console.log(`\n📝 Processing user: ${userData.fullName || userData.email}`);
            console.log(`   Current Doc ID: ${currentDocId}`);
            console.log(`   Correct UID: ${correctDocId}`);

            if (currentDocId === correctDocId) {
                console.log('   ✅ Already correct, skipping...');
                continue;
            }

            // Create new document with correct ID
            console.log('   📤 Creating new document with correct UID...');
            await setDoc(doc(db, 'users', correctDocId), userData);

            // Delete old document
            console.log('   🗑️ Deleting old document...');
            await deleteDoc(doc(db, 'users', currentDocId));

            console.log('   ✅ Migration successful!');
        }

        console.log('\n🎉 All user documents migrated successfully!');
        console.log('✨ You can now login with your credentials.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run the migration
fixUserDocuments();
