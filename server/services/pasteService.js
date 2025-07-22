const { getDb } = require('../firebase');
const { nanoid } = require('nanoid');

class PasteService {
  constructor() {
    this.db = getDb();
    this.collection = this.db.collection('pastes');
  }

  async createPaste(content, language = 'text', title = 'Untitled') {
    try {
      const id = nanoid(10);
      const paste = {
        id,
        content,
        language,
        title,
        createdAt: new Date(),
        views: 0
      };

      await this.collection.doc(id).set(paste);
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