const { getDb, authenticateUser, admin } = require('./firebase-utils');
const { nanoid } = require('nanoid');

// Input validation helper
const validateInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return false;
  if (input.length > maxLength) return false;
  // Basic XSS prevention - remove potential script tags
  const cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return cleaned;
};


exports.handler = async (event, context) => {
  const { httpMethod: method, queryStringParameters: query, body } = event;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  
  // Helper function for optional authentication
  const optionalAuth = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.log('Optional auth failed:', error.message);
      return null;
    }
  };

  try {
    const database = getDb();
    const collection = database.collection('pastes');

    if (method === 'POST') {
      // Create new paste
      const requestData = JSON.parse(body);
      
      // Check for authentication
      const user = await optionalAuth(event.headers.authorization);
      if (user) {
        requestData.userId = user.uid;
      }
      
      // Validate content - either single content or tabs with content
      if (requestData.tabs) {
        // Multi-tab validation
        if (!Array.isArray(requestData.tabs) || requestData.tabs.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid tabs data' })
          };
        }
        
        const hasContent = requestData.tabs.some(tab => tab.content && tab.content.trim());
        if (!hasContent) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'At least one tab must have content' })
          };
        }
        
        // Check size limit for all tabs combined
        const totalSize = requestData.tabs.reduce((size, tab) => size + (tab.content || '').length, 0);
        if (totalSize > 5000000) { // 5MB limit for multi-tab
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Total content size exceeds limit' })
          };
        }
      } else {
        // Single tab validation (legacy)
        const content = requestData.content;
        if (!content || content.length > 1000000) { // 1MB limit
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid content' })
          };
        }
      }

      const id = nanoid(10);
      
      // Handle both single tab and multi-tab formats
      let pasteData;
      if (requestData.tabs && Array.isArray(requestData.tabs)) {
        // Multi-tab format
        pasteData = {
          id,
          title: requestData.title || 'Multi-tab paste',
          tabs: requestData.tabs,
          type: 'multi-tab',
          createdAt: new Date(),
          views: 0,
          userId: requestData.userId || null,
          isPublic: true
        };
      } else {
        // Legacy single tab format
        pasteData = {
          id,
          content: requestData.content,
          language: requestData.language || 'text',
          title: requestData.title || 'Untitled',
          type: 'single',
          createdAt: new Date(),
          views: 0,
          userId: requestData.userId || null,
          isPublic: true
        };
      }

      await collection.doc(id).set(pasteData);
      
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