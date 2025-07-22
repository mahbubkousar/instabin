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

// Rate limiting - more restrictive for paste creation
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 paste creations per 15 minutes
  message: { error: 'Too many pastes created, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 paste reads per 15 minutes
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation helper
const validateInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return false;
  if (input.length > maxLength) return false;
  // Basic XSS prevention - remove potential script tags
  const cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return cleaned;
};

// API Routes
app.post('/api/paste', createLimiter, async (req, res) => {
  try {
    if (!pasteService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const requestData = req.body;
    
    // Validate and sanitize title
    if (requestData.title) {
      const sanitizedTitle = validateInput(requestData.title, 200);
      if (!sanitizedTitle) {
        return res.status(400).json({ error: 'Invalid title' });
      }
      requestData.title = sanitizedTitle;
    }
    
    // Validate content - either single content or tabs with content
    if (requestData.tabs) {
      // Multi-tab validation
      if (!Array.isArray(requestData.tabs) || requestData.tabs.length === 0) {
        return res.status(400).json({ error: 'Invalid tabs data' });
      }
      
      if (requestData.tabs.length > 20) { // Limit number of tabs
        return res.status(400).json({ error: 'Too many tabs (maximum 20)' });
      }
      
      // Validate and sanitize each tab
      for (let i = 0; i < requestData.tabs.length; i++) {
        const tab = requestData.tabs[i];
        
        // Validate tab title
        if (tab.title) {
          const sanitizedTitle = validateInput(tab.title, 100);
          if (!sanitizedTitle) {
            return res.status(400).json({ error: `Invalid title for tab ${i + 1}` });
          }
          tab.title = sanitizedTitle;
        }
        
        // Validate language
        const allowedLanguages = [
          'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
          'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'html', 'css',
          'scss', 'less', 'json', 'xml', 'yaml', 'sql', 'text'
        ];
        if (!allowedLanguages.includes(tab.language)) {
          tab.language = 'text'; // Default to text for unknown languages
        }
        
        // Validate content length
        if (!tab.content || typeof tab.content !== 'string') {
          tab.content = '';
        }
        if (tab.content.length > 2000000) { // 2MB per tab
          return res.status(400).json({ error: `Content too large for tab ${i + 1}` });
        }
      }
      
      const hasContent = requestData.tabs.some(tab => tab.content && tab.content.trim());
      if (!hasContent) {
        return res.status(400).json({ error: 'At least one tab must have content' });
      }
      
      // Check size limit for all tabs combined
      const totalSize = requestData.tabs.reduce((size, tab) => size + (tab.content || '').length, 0);
      if (totalSize > 5000000) { // 5MB total limit
        return res.status(400).json({ error: 'Total content size exceeds limit' });
      }
    } else if (requestData.content) {
      // Single tab validation (legacy)
      const content = requestData.content;
      if (!content || content.length > 1000000) { // 1MB limit
        return res.status(400).json({ error: 'Invalid content' });
      }
      
      // Validate language
      const allowedLanguages = [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
        'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'html', 'css',
        'scss', 'less', 'json', 'xml', 'yaml', 'sql', 'text'
      ];
      if (!allowedLanguages.includes(requestData.language)) {
        requestData.language = 'text';
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

app.get('/api/paste', readLimiter, async (req, res) => {
  try {
    if (!pasteService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Validate ID format (should be alphanumeric, 10 characters from nanoid)
    if (!/^[A-Za-z0-9_-]{10}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
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