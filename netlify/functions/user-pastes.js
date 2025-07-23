const { getDb, authenticateUser } = require('./firebase-utils');

exports.handler = async (event, context) => {
  const { httpMethod: method, queryStringParameters: query, body } = event;
  
  console.log('User-pastes function called:', { method, query, path: event.path });
  
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
      
      // Try with ordering first, fall back to simple query if index doesn't exist
      let snapshot;
      try {
        snapshot = await collection
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();
      } catch (indexError) {
        console.log('Ordered query failed, trying simple query:', indexError.message);
        // Fall back to simple query without ordering
        snapshot = await collection
          .where('userId', '==', userId)
          .limit(limit)
          .get();
      }

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
    console.error('Error stack:', error.stack);
    console.error('Environment check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      method,
      path: event.path,
      query
    });
    
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
      body: JSON.stringify({ 
        error: 'Server error',
        details: error.message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      })
    };
  }
};