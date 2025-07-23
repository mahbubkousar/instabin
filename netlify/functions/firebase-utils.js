const admin = require('firebase-admin');

// Initialize Firebase Admin (singleton pattern)
let db;
let initialized = false;

const initializeFirebase = () => {
  if (initialized && db) {
    return db;
  }

  try {
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        throw new Error('Firebase configuration missing - no PROJECT_ID or SERVICE_ACCOUNT');
      }
    }
    
    db = admin.firestore();
    initialized = true;
    console.log('Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

const getDb = () => {
  if (!db || !initialized) {
    return initializeFirebase();
  }
  return db;
};

// Authentication helper
const authenticateUser = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  try {
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized: Invalid token');
  }
};

module.exports = {
  getDb,
  authenticateUser,
  admin
};