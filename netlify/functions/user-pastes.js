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

exports.handler = async (event, context) => {
  const { httpMethod: method, queryStringParameters: query, body } = event;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    // Authenticate user for all operations
    const user = await authenticateUser(event.headers.authorization);
    const userId = user.uid;

    if (method === 'GET') {
      // Get user's pastes
      const limit = parseInt(query?.limit) || 20;
      
      const snapshot = await collection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const pastes = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        pastes.push({
          ...data,
          createdAt: data.createdAt.toDate().toISOString()
        });
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          pastes,
          hasMore: snapshot.size === limit
        })
      };

    } else if (method === 'DELETE') {
      // Delete a paste
      const pasteId = query?.id;
      
      if (!pasteId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Paste ID required' })
        };
      }

      const doc = await collection.doc(pasteId).get();
      
      if (!doc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Paste not found' })
        };
      }

      const paste = doc.data();
      
      // Only allow deletion if user owns the paste
      if (paste.userId !== userId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Unauthorized: You can only delete your own pastes' })
        };
      }

      await collection.doc(pasteId).delete();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };

    } else if (method === 'PATCH') {
      // Update paste visibility
      const pasteId = query?.id;
      
      if (!pasteId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Paste ID required' })
        };
      }

      const requestData = JSON.parse(body);
      const { isPublic } = requestData;

      if (typeof isPublic !== 'boolean') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'isPublic must be a boolean' })
        };
      }

      const doc = await collection.doc(pasteId).get();
      
      if (!doc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Paste not found' })
        };
      }

      const paste = doc.data();
      
      // Only allow update if user owns the paste
      if (paste.userId !== userId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Unauthorized: You can only modify your own pastes' })
        };
      }

      await collection.doc(pasteId).update({
        isPublic: isPublic,
        updatedAt: new Date()
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
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
    
    if (error.message.includes('Unauthorized')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};