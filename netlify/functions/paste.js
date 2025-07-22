const admin = require('firebase-admin');
const { nanoid } = require('nanoid');

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
  const { httpMethod: method, queryStringParameters: query, body } = event;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  
  try {
    const database = getDb();
    const collection = database.collection('pastes');

    if (method === 'POST') {
      // Create new paste
      const { content, language = 'text', title = 'Untitled' } = JSON.parse(body);
      
      if (!content || content.length > 1000000) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid content' })
        };
      }

      const id = nanoid(10);
      const paste = {
        id,
        content,
        language,
        title,
        createdAt: new Date(),
        views: 0
      };

      await collection.doc(id).set(paste);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ id })
      };

    } else if (method === 'GET' && query?.id) {
      // Get existing paste
      const doc = await collection.doc(query.id).get();
      
      if (!doc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Paste not found' })
        };
      }

      const paste = doc.data();
      
      // Increment view count
      await collection.doc(query.id).update({
        views: paste.views + 1
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...paste,
          views: paste.views + 1,
          createdAt: paste.createdAt.toDate().toISOString()
        })
      };

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};