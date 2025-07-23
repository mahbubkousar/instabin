const { getDb } = require('../firebase');
const { nanoid } = require('nanoid');

class PasteService {
  constructor() {
    this.db = getDb();
    this.collection = this.db.collection('pastes');
  }

  async createPaste(data) {
    try {
      const id = nanoid(10);
      
      // Handle both single tab and multi-tab formats
      let pasteData;
      if (data.tabs && Array.isArray(data.tabs)) {
        // Multi-tab format
        pasteData = {
          id,
          title: data.title || 'Multi-tab paste',
          tabs: data.tabs,
          type: 'multi-tab',
          createdAt: new Date(),
          views: 0,
          userId: data.userId || null,
          isPublic: true
        };
      } else {
        // Legacy single tab format
        pasteData = {
          id,
          content: data.content || data,
          language: data.language || 'text',
          title: data.title || 'Untitled',
          type: 'single',
          createdAt: new Date(),
          views: 0,
          userId: data.userId || null,
          isPublic: true
        };
      }

      await this.collection.doc(id).set(pasteData);
      return { id };
    } catch (error) {
      throw new Error('Failed to create paste: ' + error.message);
    }
  }

  async getPaste(id) {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const paste = doc.data();
      
      // Increment view count
      await this.collection.doc(id).update({
        views: paste.views + 1
      });

      // Return updated paste data
      return {
        ...paste,
        views: paste.views + 1,
        createdAt: paste.createdAt.toDate().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to get paste: ' + error.message);
    }
  }

  async getUserPastes(userId, limit = 20, lastDoc = null) {
    try {
      let query = this.collection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const pastes = [];
      let lastDocument = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        pastes.push({
          ...data,
          createdAt: data.createdAt.toDate().toISOString()
        });
        lastDocument = doc;
      });

      return {
        pastes,
        lastDoc: lastDocument,
        hasMore: snapshot.size === limit
      };
    } catch (error) {
      throw new Error('Failed to get user pastes: ' + error.message);
    }
  }

  async deletePaste(id, userId) {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new Error('Paste not found');
      }

      const paste = doc.data();
      
      // Only allow deletion if user owns the paste
      if (paste.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own pastes');
      }

      await this.collection.doc(id).delete();
      return { success: true };
    } catch (error) {
      throw new Error('Failed to delete paste: ' + error.message);
    }
  }

  async updatePasteVisibility(id, userId, isPublic) {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new Error('Paste not found');
      }

      const paste = doc.data();
      
      // Only allow update if user owns the paste
      if (paste.userId !== userId) {
        throw new Error('Unauthorized: You can only modify your own pastes');
      }

      await this.collection.doc(id).update({
        isPublic: isPublic,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      throw new Error('Failed to update paste: ' + error.message);
    }
  }

  async getStats() {
    try {
      const snapshot = await this.collection.count().get();
      return {
        totalPastes: snapshot.data().count
      };
    } catch (error) {
      return {
        totalPastes: 0
      };
    }
  }
}

module.exports = PasteService;