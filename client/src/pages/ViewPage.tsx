import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './ViewPage.css';

interface Paste {
  id: string;
  content: string;
  language: string;
  title: string;
  createdAt: string;
  views: number;
}

const ViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<Paste | null>(null);
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
    if (paste?.content) {
      navigator.clipboard.writeText(paste.content);
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
              <span className="language">{paste.language}</span>
              <span className="views">{paste.views} views</span>
              <span className="date">
                {new Date(paste.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="actions">
            <button onClick={handleCopyCode} className="action-btn">
              {copied ? 'Copied!' : 'Copy Code'}
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
        <div className="editor-container">
          <Editor
            height="calc(100vh - 80px)"
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
      </main>
    </div>
  );
};

export default ViewPage;