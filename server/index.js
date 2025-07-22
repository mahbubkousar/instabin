const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const PasteService = require('./services/pasteService');
const { initializeFirebase } = require('./firebase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase
let pasteService;
try {
  initializeFirebase();
  pasteService = new PasteService();
  console.log('PasteService initialized');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// API Routes
app.post('/api/paste', async (req, res) => {
  try {
    if (!pasteService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const requestData = req.body;
    
    // Validate content - either single content or tabs with content
    if (requestData.tabs) {
      // Multi-tab validation
      if (!Array.isArray(requestData.tabs) || requestData.tabs.length === 0) {
        return res.status(400).json({ error: 'Invalid tabs data' });
      }
      
      const hasContent = requestData.tabs.some(tab => tab.content && tab.content.trim());
      if (!hasContent) {
        return res.status(400).json({ error: 'At least one tab must have content' });
      }
      
      // Check size limit for all tabs combined
      const totalSize = requestData.tabs.reduce((size, tab) => size + (tab.content || '').length, 0);
      if (totalSize > 5000000) { // 5MB limit for multi-tab
        return res.status(400).json({ error: 'Total content size exceeds limit' });
      }
    } else if (requestData.content) {
      // Single tab validation (legacy)
      const content = requestData.content;
      if (!content || content.length > 1000000) { // 1MB limit
        return res.status(400).json({ error: 'Invalid content' });
      }
    } else {
      // Neither tabs nor content provided
      return res.status(400).json({ error: 'Either tabs or content must be provided' });
    }

    const result = await pasteService.createPaste(requestData);
    res.json(result);
  } catch (error) {
    console.error('Create paste error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/paste', async (req, res) => {
  try {
    if (!pasteService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }

    const paste = await pasteService.getPaste(id);
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    
    res.json(paste);
  } catch (error) {
    console.error('Get paste error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (!pasteService) {
      return res.json({ status: 'initializing', pastes: 0 });
    }

    const stats = await pasteService.getStats();
    res.json({ status: 'ok', ...stats });
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  // In development, serve the test client
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-client.html'));
  });
  
  app.get('/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-client.html'));
  });
}

app.listen(PORT, () => {
  console.log(`InstaBin server running on port ${PORT}`);
});