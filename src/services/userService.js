// User service for authentication and user management
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User operations
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

  // Create user account
  createUser: async (userData) => {
    try {
      const docRef = await addDoc(collection(db, 'users'), userData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  },

  // Change password
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const userRef = doc(db, 'users', userId);
      const usersRef = collection(db, 'users');
      const userDoc = await getDocs(query(usersRef, where('__name__', '==', userId)));
      
      if (userDoc.empty) {
        return { success: false, message: 'User not found' };
      }

      const userData = userDoc.docs[0].data();

      // Verify current password
      if (userData.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Update password
      await updateDoc(userRef, {
        password: newPassword,
        isDefaultPassword: false,
        lastPasswordChange: new Date().toISOString()
      });

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: users };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, message: 'Failed to get users' };
    }
  },

  // Create teacher account when teacher is added
  createTeacherAccount: async (teacherData) => {
    try {
      const userData = {
        email: teacherData.email,
        password: '1234', // Default password
        role: 'teacher',
        name: `${teacherData.firstName} ${teacherData.lastName}`,
        teacherId: teacherData.id,
        isDefaultPassword: true,
        createdAt: new Date().toISOString()
      };

      const result = await userAPI.createUser(userData);
      return result;
    } catch (error) {
      console.error('Create teacher account error:', error);
      return { success: false, message: 'Failed to create teacher account' };
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, profileData);
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }
};
