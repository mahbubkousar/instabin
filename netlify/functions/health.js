const admin = require('firebase-admin');

// Initialize Firebase Admin
let db;
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }
  db = admin.firestore();
  return db;
};

const getDb = () => {
  if (!db) {
    return initializeFirebase();
  }
  return db;
};

exports.handler = async (event, context) => {
  const { httpMethod: method } = event;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const database = getDb();
    const collection = database.collection('pastes');
    
    // Get paste count
    const snapshot = await collection.count().get();
    const totalPastes = snapshot.data().count;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        totalPastes,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        totalPastes: 0,
        timestamp: new Date().toISOString(),
        note: 'Count unavailable'
      })
    };
  }
};