import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    if (!code.trim()) {
      alert('Please enter some code to share');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/paste', {
        content: code,
        language,
        title: title || 'Untitled'
      });

      // Generate the correct URL for development/production
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000';
      const shareUrl = `${baseUrl}/${response.data.id}`;
      
      setShareUrl(shareUrl);
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      alert('Failed to create paste. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPaste = () => {
    setCode('');
    setTitle('');
    setShareUrl('');
  };

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css',
    'json', 'xml', 'yaml', 'sql', 'text'
  ];

  return (
    <div className="home-page">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">InstaBin</h1>
          <p className="tagline">Share code instantly</p>
        </div>
      </header>

      {shareUrl ? (
        <div className="share-success">
          <div className="success-content">
            <h2>Code shared successfully!</h2>
            <div className="url-container">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-url"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="copy-btn"
              >
                Copy
              </button>
            </div>
            <div className="actions">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-btn"
              >
                View Paste
              </a>
              <button onClick={handleNewPaste} className="new-btn">
                Create New
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="main-content">
          <div className="controls">
            <div className="control-group">
              <input
                type="text"
                placeholder="Paste title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleShare}
              disabled={isLoading}
              className="share-button"
            >
              {isLoading ? 'Sharing...' : 'Share Code'}
            </button>
          </div>

          <div className="editor-container">
            <Editor
              height="calc(100vh - 200px)"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0
              }}
            />
          </div>
        </main>
      )}
    </div>
  );
};

export default HomePage;