// Simple Admin Account Recovery Script
// Copy and paste this entire script into your browser console while on the app page

const createAdminAccount = async () => {
  try {
    console.log('🚀 Starting admin account recovery...');
    
    // Check if we're on the app page and Firebase is available
    if (typeof window === 'undefined' || !window.location) {
      console.error('❌ Please run this script in your browser console');
      return;
    }

    // Try to access Firebase through the app's existing instance
    let db;
    
    // Method 1: Try to use the app's Firebase instance if available
    if (window.firebase) {
      console.log('📡 Using existing Firebase instance...');
      db = window.firebase.firestore();
    } else {
      console.log('📡 Loading Firebase from CDN...');
      
      // Load Firebase from CDN
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const { getFirestore, collection, addDoc, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      
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

    console.log('🔍 Checking for existing admin account...');
    
    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('email', '==', 'admin@sched.com'));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('⚠️ Admin account already exists:');
      adminSnapshot.forEach(doc => {
        console.log(`   - ${doc.data().email} (ID: ${doc.id})`);
      });
      return { success: false, message: 'Admin account already exists' };
    }

    console.log('✅ No existing admin found, creating new admin account...');
    
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

    const docRef = await addDoc(collection(db, 'users'), adminData);
    
    console.log('🎉 Admin account created successfully!');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Document ID: ${docRef.id}`);
    
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
    console.error('💡 Make sure you are on the app page and try again');
    return { 
      success: false, 
      message: 'Failed to create admin account: ' + error.message 
    };
  }
};

// Display instructions
console.log('🔧 Admin Account Recovery Tool');
console.log('📝 This will create an admin account with:');
console.log('   Email: admin@sched.com');
console.log('   Password: admin123');
console.log('   Role: admin');
console.log('');

// Run the recovery
createAdminAccount().then(result => {
  console.log('📋 Result:', result);
  if (result.success) {
    console.log('');
    console.log('🎉 SUCCESS! You can now login with:');
    console.log(`   Email: ${result.credentials.email}`);
    console.log(`   Password: ${result.credentials.password}`);
    console.log('');
    console.log('💡 Refresh the page and login as admin.');
  } else {
    console.log('');
    console.log('❌ FAILED:', result.message);
    console.log('💡 Try refreshing the page and running the script again.');
  }
});

// Make it available globally
window.createAdminAccount = createAdminAccount;
