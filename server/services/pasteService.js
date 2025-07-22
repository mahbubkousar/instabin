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
          views: 0
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
          views: 0
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