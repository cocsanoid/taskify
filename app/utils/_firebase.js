import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSjpCulmajAKN5ZFP8NVcwbmDDdLjko7U",
  authDomain: "taskplus-4ea2f.firebaseapp.com",
  projectId: "taskplus-4ea2f",
  storageBucket: "taskplus-4ea2f.firebasestorage.app",
  messagingSenderId: "151563198797",
  appId: "1:151563198797:web:e1e11c2549b8885a4a5704",
  measurementId: "G-8BS9P8M0RK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

const db = getFirestore(app);

// Authentication functions
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase login error:', error.code, error.message);
    throw error; // Rethrow the error for handling in the login component
  }
};

const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase registration error:', error.code, error.message);
    throw error; // Rethrow the error for handling in the registration component
  }
};

const logoutUser = () => signOut(auth);

// Helper function to convert date objects for Firestore
const processDateField = (data) => {
  // Copy the data to avoid mutating the original
  const processedData = { ...data };
  
  // Convert Date objects to Firestore Timestamps
  if (processedData.dueDate instanceof Date) {
    // Make sure the date is valid before converting
    if (!isNaN(processedData.dueDate.getTime())) {
      // Preserve the actual time part of the date
      processedData.dueDate = Timestamp.fromDate(processedData.dueDate);
    } else {
      console.error('Invalid Date object in dueDate');
      delete processedData.dueDate;
    }
  } else if (processedData.dueDate && typeof processedData.dueDate === 'object' && processedData.dueDate.__type === 'Date') {
    // Handle custom date format from JSON serialization
    try {
      const dateObj = new Date(processedData.dueDate.iso);
      if (!isNaN(dateObj.getTime())) {
        // Preserve the time component
        processedData.dueDate = Timestamp.fromDate(dateObj);
      } else {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      console.error('Error converting custom date format to Timestamp:', error);
      delete processedData.dueDate;
    }
  } else if (processedData.dueDate && typeof processedData.dueDate === 'string') {
    // If it's a date string, convert to Date then to Timestamp
    try {
      const dateObj = new Date(processedData.dueDate);
      if (!isNaN(dateObj.getTime())) {
        // Preserve the time component
        processedData.dueDate = Timestamp.fromDate(dateObj);
      } else {
        throw new Error('Invalid date string');
      }
    } catch (error) {
      console.error('Error converting date string to Timestamp:', error);
      delete processedData.dueDate; // Remove invalid date to prevent errors
    }
  }
  
  return processedData;
};

// Firestore functions for tasks
const addTask = async (userId, task) => {
  try {
    // Make sure we're storing dates as Firestore timestamps
    let taskToAdd = { ...task, userId };
    
    // Convert JavaScript Date to Firestore Timestamp if needed
    if (task.dueDate && task.dueDate instanceof Date) {
      // Preserve the time part of the date
      taskToAdd.dueDate = Timestamp.fromDate(task.dueDate);
    }
    
    // Add createdAt timestamp
    taskToAdd.createdAt = Timestamp.now();
    
    // Ensure category exists, default to 'noCategory' if not specified
    if (!taskToAdd.category) {
      taskToAdd.category = 'noCategory';
    }
    
    console.log('Adding task with data:', taskToAdd);
    
    const docRef = await addDoc(collection(db, 'tasks'), taskToAdd);
    
    // Create the task with ID
    const newTask = {
      ...taskToAdd,
      id: docRef.id // Ensure document ID comes last to override any 'id' in the data
    };
    
    // Return the complete task with ID
    return newTask;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

const getTasks = async (userId) => {
  try {
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const tasks = [];
    querySnapshot.forEach((doc) => {
      const taskData = doc.data();
      console.log('Raw task data from Firestore:', doc.id, taskData);
      
      // Create a copy of the data to avoid mutating the original
      const processedData = { ...taskData };
      
      // Properly convert Firestore Timestamps to JavaScript Date objects
      if (processedData.dueDate) {
        if (processedData.dueDate instanceof Timestamp) {
          console.log('Converting Firestore Timestamp to Date:', doc.id);
          processedData.dueDate = processedData.dueDate.toDate();
        } else if (processedData.dueDate && 
                  typeof processedData.dueDate === 'object' && 
                  'seconds' in processedData.dueDate && 
                  'nanoseconds' in processedData.dueDate) {
          console.log('Converting nanoseconds/seconds to Date:', doc.id);
          const seconds = processedData.dueDate.seconds;
          const nanoseconds = processedData.dueDate.nanoseconds;
          processedData.dueDate = new Date(seconds * 1000 + nanoseconds / 1000000);
        }
      }
      
      if (processedData.createdAt && processedData.createdAt instanceof Timestamp) {
        processedData.createdAt = processedData.createdAt.toDate();
      }
      
      // Create the task with the document ID (forcing the document ID to take precedence)
      // This ensures the Firestore document ID is always used, regardless of any 'id' field in the data
      const task = { 
        ...processedData,
        id: doc.id // Ensure document ID comes last to override any 'id' in the data
      };
      
      // Log the processed task with date conversion
      console.log('Processed task:', doc.id, 
        'dueDate:', task.dueDate instanceof Date ? 'JavaScript Date' : 
        (task.dueDate ? typeof task.dueDate : 'no dueDate'));
          
      tasks.push(task);
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

const updateTask = async (taskId, updates) => {
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    
    // Get the current task data first to have access to userId and other fields
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const currentTask = {
      id: taskId,
      ...taskSnapshot.data()
    };
    
    // Process updates to convert JS Date objects to Firestore Timestamps
    let processedUpdates = { ...updates };
    
    // Convert JavaScript Date to Firestore Timestamp if needed
    if (updates.dueDate && updates.dueDate instanceof Date) {
      // Preserve the time part when converting to Timestamp
      processedUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    
    // Add updatedAt timestamp
    processedUpdates.updatedAt = Timestamp.now();
    
    console.log('Updating task with data:', taskId, processedUpdates);
    
    // Update the task
    await updateDoc(taskDocRef, processedUpdates);
    
    // Create the updated task by merging current and new data
    const updatedTask = {
      ...currentTask,
      ...updates, // Use original updates with JS Date for client use
      updatedAt: new Date(),
      id: taskId // Ensure the ID is preserved
    };
    
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

const deleteTask = async (taskId) => {
  try {
    // Get the task first to check for notification ID
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Delete the task document
    await deleteDoc(doc(db, 'tasks', taskId));
    
    return { success: true, id: taskId };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

const addNote = async (userId, note) => {
  try {
    const noteToAdd = {
      ...note,
      userId,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'notes'), noteToAdd);
    return {
      ...noteToAdd,
      createdAt: new Date(), // Convert back to JS Date for client use
      id: docRef.id // Ensure document ID comes last to override any 'id' in the data
    };
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

const getNotes = async (userId) => {
  try {
    const q = query(collection(db, 'notes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to JS Date
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : data.createdAt;
      
      notes.push({
        ...data,
        createdAt,
        id: doc.id // Ensure document ID comes last to override any 'id' in the data
      });
    });
    
    return notes;
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
};

const updateNote = (noteId, updates) => 
  updateDoc(doc(db, 'notes', noteId), updates);

const deleteNote = (noteId) => 
  deleteDoc(doc(db, 'notes', noteId));

// User preferences
const getUserPreferences = async (userId) => {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};

const updateUserPreferences = async (userId, preferences) => {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing preferences
      await updateDoc(docRef, preferences);
    } else {
      // Create new preferences document
      await setDoc(docRef, {
        ...preferences,
        createdAt: Timestamp.now()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// Get a single task by ID
const getTask = async (taskId) => {
  try {
    const docRef = doc(db, 'tasks', taskId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Task with ID ${taskId} not found`);
      return null;
    }
    
    const taskData = docSnap.data();
    
    // Create a task object with processed date fields
    const task = {
      ...taskData,
      id: taskId,
    };
    
    // Convert Firestore Timestamp to Date object for client-side use
    if (taskData.dueDate instanceof Timestamp) {
      task.dueDate = taskData.dueDate.toDate();
    }
    
    if (taskData.createdAt instanceof Timestamp) {
      task.createdAt = taskData.createdAt.toDate();
    }
    
    if (taskData.updatedAt instanceof Timestamp) {
      task.updatedAt = taskData.updatedAt.toDate();
    }
    
    return task;
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

// Export all functions
export {
  auth,
  db,
  loginUser,
  registerUser,
  logoutUser,
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  getUserPreferences,
  updateUserPreferences,
  getTask
};

// Default export for use as a React component (needed by expo-router)
export default function FirebaseUtilsComponent() {
  return null; // This component is never actually rendered
} 