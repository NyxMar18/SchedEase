// Quick Admin Account Recovery Script
// Copy and paste this entire script into your browser console while on the app

const quickAdminRecovery = async () => {
  try {
    console.log('🚀 Starting quick admin account recovery...');
    
    // Check if Firebase is available
    if (typeof window.firebase === 'undefined') {
      console.log('📡 Firebase not available globally, using CDN imports...');
    }

    // Use the existing Firebase instance or create one
    let db;
    if (window.firebase) {
      db = window.firebase.firestore();
    } else {
      // Try to use the app's Firebase instance
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      
      // Use the config from your app
      const firebaseConfig = {
        apiKey: "AIzaSyABJGjp4tnphnbFvMPO1s97u-okUd_FJzU",
        authDomain: "schedease-ab992.firebaseapp.com",
        projectId: "schedease-ab992",
        storageBucket: "schedease-ab992.firebasestorage.app",
        messagingSenderId: "632325049677",
        appId: "1:632325049677:web:fe3d09435f705274c17b04",
        measurementId: "G-SBMP78ZHSK"
      };
      
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    }

    // Check if admin already exists
    const usersRef = db.collection('users');
    const adminQuery = usersRef.where('email', '==', 'admin@sched.com');
    const adminSnapshot = await adminQuery.get();
    
    if (!adminSnapshot.empty) {
      console.log('❌ Admin account already exists');
      console.log('📋 Existing admin accounts:');
      adminSnapshot.forEach(doc => {
        console.log(`   - ${doc.data().email} (ID: ${doc.id})`);
      });
      return { success: false, message: 'Admin account already exists' };
    }

    // Create admin account
    const adminData = {
      email: 'admin@sched.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrator',
      isDefaultPassword: false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    const docRef = await usersRef.add(adminData);
    console.log('✅ Admin account created successfully!');
    console.log('📋 Account Details:');
    console.log(`   - Email: ${adminData.email}`);
    console.log(`   - Password: ${adminData.password}`);
    console.log(`   - Role: ${adminData.role}`);
    console.log(`   - Document ID: ${docRef.id}`);
    
    return { 
      success: true,
      message: 'Admin account created successfully',
      id: docRef.id,
      credentials: {
        email: adminData.email,
        password: adminData.password
      }
    };
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    return { 
      success: false, 
      message: 'Failed to create admin account: ' + error.message 
    };
  }
};

// Run the script
console.log('🔧 Admin Account Recovery Tool');
console.log('📝 This will create an admin account with:');
console.log('   Email: admin@sched.com');
console.log('   Password: admin123');
console.log('   Role: admin');
console.log('');

quickAdminRecovery().then(result => {
  console.log('📋 Final Result:', result);
  if (result.success) {
    console.log('🎉 SUCCESS! You can now login with:');
    console.log(`   Email: ${result.credentials.email}`);
    console.log(`   Password: ${result.credentials.password}`);
    console.log('');
    console.log('💡 You can now refresh the page and login as admin.');
  } else {
    console.log('❌ FAILED:', result.message);
  }
});

// Export for manual use
window.quickAdminRecovery = quickAdminRecovery;
