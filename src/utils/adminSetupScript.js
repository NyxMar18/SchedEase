// Browser console script to create admin account
// Copy and paste this entire script into your browser console while on the app

const createAdminAccountScript = async () => {
  try {
    console.log('🚀 Starting admin account creation...');
    
    // Import Firebase modules (assuming they're available globally)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const { getFirestore, collection, addDoc, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    
    // Firebase config (replace with your actual config)
    const firebaseConfig = {
      apiKey: "AIzaSyABJGjp4tnphnbFvMPO1s97u-okUd_FJzU",
      authDomain: "schedease-ab992.firebaseapp.com",
      projectId: "schedease-ab992",
      storageBucket: "schedease-ab992.firebasestorage.app",
      messagingSenderId: "632325049677",
      appId: "1:632325049677:web:fe3d09435f705274c17b04",
      measurementId: "G-SBMP78ZHSK"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('email', '==', 'admin@sched.com'));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('❌ Admin account already exists');
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

    const docRef = await addDoc(collection(db, 'users'), adminData);
    console.log('✅ Admin account created successfully with ID:', docRef.id);
    
    return { 
      success: true, 
      message: 'Admin account created successfully',
      id: docRef.id 
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
createAdminAccountScript().then(result => {
  console.log('📋 Final Result:', result);
  if (result.success) {
    console.log('🎉 You can now login with:');
    console.log('   Email: admin@sched.com');
    console.log('   Password: admin123');
  }
});

// Export for manual use
window.createAdminAccount = createAdminAccountScript;

