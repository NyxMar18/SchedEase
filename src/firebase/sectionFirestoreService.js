import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Section operations
export const sectionFirestoreAPI = {
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sections'));
      const sections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: sections };
    } catch (error) {
      console.error('Error getting sections from Firestore:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sections'));
      const section = querySnapshot.docs.find(doc => doc.id === id);
      return { data: section ? { id: section.id, ...section.data() } : null };
    } catch (error) {
      console.error('Error getting section by id from Firestore:', error);
      throw error;
    }
  },

  create: async (section) => {
    try {
      const docRef = await addDoc(collection(db, 'sections'), section);
      return { data: { id: docRef.id, ...section } };
    } catch (error) {
      console.error('Error creating section in Firestore:', error);
      throw error;
    }
  },

  update: async (id, updatedSection) => {
    try {
      const sectionRef = doc(db, 'sections', id);
      await updateDoc(sectionRef, updatedSection);
      return { data: { id, ...updatedSection } };
    } catch (error) {
      console.error('Error updating section in Firestore:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const sectionRef = doc(db, 'sections', id);
      await deleteDoc(sectionRef);
      return { data: { id } };
    } catch (error) {
      console.error('Error deleting section from Firestore:', error);
      throw error;
    }
  }
};

