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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { method, query, body } = req;
  
  try {
    const database = getDb();
    const collection = database.collection('pastes');

    if (method === 'POST') {
      // Create new paste
      const { content, language = 'text', title = 'Untitled' } = body;
      
      if (!content || content.length > 1000000) {
        return res.status(400).json({ error: 'Invalid content' });
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
      return res.status(201).json({ id });

    } else if (method === 'GET' && query.id) {
      // Get existing paste
      const doc = await collection.doc(query.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Paste not found' });
      }

      const paste = doc.data();
      
      // Increment view count
      await collection.doc(query.id).update({
        views: paste.views + 1
      });

      return res.status(200).json({
        ...paste,
        views: paste.views + 1,
        createdAt: paste.createdAt.toDate().toISOString()
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};