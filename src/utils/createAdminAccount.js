// Script to create admin account in Firebase Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const createAdminAccount = async () => {
  try {
    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('email', '==', 'admin@sched.com'));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('Admin account already exists');
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
    console.log('Admin account created successfully with ID:', docRef.id);
    
    return { 
      success: true, 
      message: 'Admin account created successfully',
      id: docRef.id 
    };
  } catch (error) {
    console.error('Error creating admin account:', error);
    return { 
      success: false, 
      message: 'Failed to create admin account: ' + error.message 
    };
  }
};

// Function to run the script
export const runCreateAdminScript = async () => {
  console.log('Creating admin account...');
  const result = await createAdminAccount();
  console.log('Result:', result);
  return result;
};

