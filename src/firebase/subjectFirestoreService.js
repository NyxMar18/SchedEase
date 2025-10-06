import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Subject operations
export const subjectFirestoreAPI = {
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: subjects };
    } catch (error) {
      console.error('Error getting subjects from Firestore:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subject = querySnapshot.docs.find(doc => doc.id === id);
      return { data: subject ? { id: subject.id, ...subject.data() } : null };
    } catch (error) {
      console.error('Error getting subject by id from Firestore:', error);
      throw error;
    }
  },

  create: async (subject) => {
    try {
      const docRef = await addDoc(collection(db, 'subjects'), subject);
      return { data: { id: docRef.id, ...subject } };
    } catch (error) {
      console.error('Error creating subject in Firestore:', error);
      throw error;
    }
  },

  update: async (id, updatedSubject) => {
    try {
      const subjectRef = doc(db, 'subjects', id);
      await updateDoc(subjectRef, updatedSubject);
      return { data: { id, ...updatedSubject } };
    } catch (error) {
      console.error('Error updating subject in Firestore:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const subjectRef = doc(db, 'subjects', id);
      await deleteDoc(subjectRef);
      return { data: { id } };
    } catch (error) {
      console.error('Error deleting subject from Firestore:', error);
      throw error;
    }
  }
};

