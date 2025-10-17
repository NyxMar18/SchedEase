import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const userAPI = {
  // Login with email and password
  login: async (email, password) => {
    try {
      console.log('🔍 Searching for user with email:', email);
      
      // Check if user exists in users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Query result - found documents:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log('❌ No user found with email:', email);
        return { success: false, message: 'User not found' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('👤 Found user data:', userData);
      console.log('🔑 Checking password - provided:', password, 'stored:', userData.password);

      // Check password
      if (userData.password !== password) {
        console.log('❌ Password mismatch');
        return { success: false, message: 'Invalid password' };
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = userData;
      const user = {
        id: userDoc.id,
        ...userWithoutPassword
      };

      console.log('✅ Login successful, returning user:', user);
      return { success: true, user };
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, message: 'Login failed: ' + error.message };
    }
  },

  // Create a new user
  create: async (userData) => {
    try {
      const docRef = await addDoc(collection(db, 'users'), userData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: error.message };
    }
  },

  // Create admin account
  createAdminAccount: async (adminData) => {
    try {
      const adminUserData = {
        ...adminData,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      const result = await userAPI.create(adminUserData);
      return result;
    } catch (error) {
      console.error('Error creating admin account:', error);
      return { success: false, message: error.message };
    }
  },

  // Create teacher account
  createTeacherAccount: async (teacherData) => {
    try {
      const teacherUserData = {
        email: teacherData.email,
        password: '1234', // Default password
        name: `${teacherData.firstName} ${teacherData.lastName}`,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        role: 'teacher',
        teacherId: teacherData.id,
        createdAt: new Date().toISOString()
      };
      
      const result = await userAPI.create(teacherUserData);
      return result;
    } catch (error) {
      console.error('Error creating teacher account:', error);
      return { success: false, message: error.message };
    }
  },

  // Get all users
  getAll: async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, message: error.message };
    }
  },

  // Update user
  update: async (userId, userData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, userData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: error.message };
    }
  },

  // Change password
  changePassword: async (userId, newPassword) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { password: newPassword });
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: error.message };
    }
  },

  // Delete user
  delete: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error.message };
    }
  }
};