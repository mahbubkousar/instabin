import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './ViewPage.css';

interface CodeTab {
  title: string;
  content: string;
  language: string;
}

interface Paste {
  id: string;
  title: string;
  createdAt: string;
  views: number;
  type?: 'single' | 'multi-tab';
  // Legacy single tab format
  content?: string;
  language?: string;
  // New multi-tab format
  tabs?: CodeTab[];
}

const ViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<Paste | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPaste = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`/api/paste?id=${id}`);
        setPaste(response.data);
      } catch (err) {
        setError('Paste not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  const handleCopyCode = () => {
    let textToCopy = '';
    
    if (paste?.type === 'multi-tab' && paste.tabs) {
      // Copy all tabs with separators
      textToCopy = paste.tabs.map(tab => 
        `// === ${tab.title} (${tab.language}) ===\n${tab.content}`
      ).join('\n\n');
    } else if (paste?.content) {
      // Legacy single tab
      textToCopy = paste.content;
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCurrentTab = () => {
    if (paste?.type === 'multi-tab' && paste.tabs?.[activeTabIndex]) {
      navigator.clipboard.writeText(paste.tabs[activeTabIndex].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="view-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="view-page">
        <div className="error">
          <h2>Paste not found</h2>
          <p>The paste you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="back-btn">
            Create New Paste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="view-page">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            InstaBin
          </Link>
          <div className="paste-info">
            <h2 className="paste-title">{paste.title}</h2>
            <div className="paste-meta">
              {paste.type === 'multi-tab' && paste.tabs ? (
                <>
                  <span className="tab-count">{paste.tabs.length} tabs</span>
                  <span className="views">{paste.views} views</span>
                </>
              ) : (
                <>
                  <span className="language">{paste.language}</span>
                  <span className="views">{paste.views} views</span>
                </>
              )}
              <span className="date">
                {new Date(paste.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="actions">
            {paste.type === 'multi-tab' && paste.tabs && (
              <button onClick={handleCopyCurrentTab} className="action-btn">
                {copied ? 'Copied!' : 'Copy Tab'}
              </button>
            )}
            <button onClick={handleCopyCode} className="action-btn">
              {copied ? 'Copied!' : paste.type === 'multi-tab' ? 'Copy All' : 'Copy Code'}
            </button>
            <button onClick={handleCopyUrl} className="action-btn">
              Copy URL
            </button>
            <Link to="/" className="action-btn new-paste-btn">
              New Paste
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        {paste.type === 'multi-tab' && paste.tabs ? (
          <div className="tabs-container">
            <div className="tabs-header">
              {paste.tabs.map((tab, index) => (
                <div 
                  key={index}
                  className={`tab ${activeTabIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <span className="tab-title">{tab.title}</span>
                  <span className="tab-language">({tab.language})</span>
                </div>
              ))}
            </div>
            <div className="editor-container">
              <Editor
                height="calc(100vh - 160px)"
                language={paste.tabs[activeTabIndex]?.language || 'text'}
                theme="vs-dark"
                value={paste.tabs[activeTabIndex]?.content || ''}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  overviewRulerLanes: 0,
                  contextmenu: false,
                  selectOnLineNumbers: true
                }}
              />
            </div>
          </div>
        ) : (
          <div className="editor-container">
            <Editor
              height="calc(100vh - 120px)"
              language={paste.language}
              theme="vs-dark"
              value={paste.content}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
                contextmenu: false,
                selectOnLineNumbers: true
              }}
            />
          </div>
        )}
      </main>
      
      <footer className="footer">
        Made with ❤️ by <a href="https://asymptote-labs.com" target="_blank" rel="noopener noreferrer">Asymptote Labs</a>
      </footer>
    </div>
  );
};

export default ViewPage;