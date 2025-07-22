import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './HomePage.css';

interface CodeTab {
  id: string;
  title: string;
  content: string;
  language: string;
}

const HomePage: React.FC = () => {
  const [tabs, setTabs] = useState<CodeTab[]>([
    {
      id: '1',
      title: 'Untitled',
      content: '',
      language: 'javascript'
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Get active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Tab management functions
  const addTab = () => {
    const newId = Date.now().toString();
    const newTab: CodeTab = {
      id: newId,
      title: 'Untitled',
      content: '',
      language: 'javascript'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const removeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't remove last tab
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateTab = (tabId: string, updates: Partial<CodeTab>) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  };

  const handleShare = async () => {
    // Check if any tab has content
    const hasContent = tabs.some(tab => tab.content.trim());
    if (!hasContent) {
      showNotification('Please enter some code in at least one tab to share', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/paste', {
        tabs: tabs.map(tab => ({
          title: tab.title || 'Untitled',
          content: tab.content,
          language: tab.language
        })),
        title: 'Multi-tab paste'
      });

      // Generate the correct URL for development/production
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000';
      const shareUrl = `${baseUrl}/${response.data.id}`;
      
      setShareUrl(shareUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showNotification('Link copied to clipboard! 🎉', 'success');
    } catch (error) {
      console.error('Share error:', error);
      showNotification('Failed to create paste. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: type === 'success' ? '#4caf50' : '#f44336',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const handleNewPaste = () => {
    setTabs([{
      id: '1',
      title: 'Untitled',
      content: '',
      language: 'javascript'
    }]);
    setActiveTabId('1');
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
                placeholder="Tab title (optional)"
                value={activeTab?.title || ''}
                onChange={(e) => updateTab(activeTabId, { title: e.target.value })}
                className="title-input"
              />
              <select
                value={activeTab?.language || 'javascript'}
                onChange={(e) => updateTab(activeTabId, { language: e.target.value })}
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
              className={`share-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading && <div className="spinner"></div>}
              {isLoading ? 'Sharing...' : 'Share All Tabs'}
            </button>
          </div>

          <div className="tabs-container">
            <div className="tabs-header">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="tab-title">
                    {tab.title || 'Untitled'} 
                    <span className="tab-language">({tab.language})</span>
                  </span>
                  {tabs.length > 1 && (
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTab(tab.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button className="add-tab" onClick={addTab}>
                +
              </button>
            </div>

            <div className="editor-container">
              <Editor
                key={activeTabId} // Force re-render when tab changes
                height="calc(100vh - 280px)"
                language={activeTab?.language || 'javascript'}
                theme="vs-dark"
                value={activeTab?.content || ''}
                onChange={(value) => updateTab(activeTabId, { content: value || '' })}
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
          </div>
        </main>
      )}
      
      <footer className="footer">
        Made with ❤️ by <a href="https://asymptote-labs.com" target="_blank" rel="noopener noreferrer">Asymptote Labs</a>
      </footer>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default HomePage;