import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import AuthModal from '../components/AuthModal';
import './MyPastesPage.css';

interface Paste {
  id: string;
  title: string;
  tabs?: Array<{
    title: string;
    content: string;
    language: string;
  }>;
  content?: string;
  language?: string;
  type: 'single' | 'multi-tab';
  createdAt: string;
  views: number;
  isPublic: boolean;
}

const MyPastesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    fetchUserPastes();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserPastes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      
      const response = await fetch('/api/user/pastes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pastes');
      }

      const data = await response.json();
      setPastes(data.pastes);
    } catch (error) {
      console.error('Error fetching pastes:', error);
      setError('Failed to load pastes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaste = async (pasteId: string) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this paste? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`/api/user/paste/${pasteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete paste');
      }

      // Remove paste from local state
      setPastes(pastes.filter(paste => paste.id !== pasteId));
      showNotification('Paste deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting paste:', error);
      showNotification('Failed to delete paste', 'error');
    }
  };

  const handleToggleVisibility = async (pasteId: string, currentVisibility: boolean) => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`/api/user/paste/${pasteId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !currentVisibility
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update paste visibility');
      }

      // Update paste in local state
      setPastes(pastes.map(paste => 
        paste.id === pasteId 
          ? { ...paste, isPublic: !currentVisibility }
          : paste
      ));
      
      showNotification(
        `Paste is now ${!currentVisibility ? 'public' : 'private'}`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating paste visibility:', error);
      showNotification('Failed to update paste visibility', 'error');
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%) translateY(-20px)",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "10000",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      backgroundColor: type === "success" ? "#4caf50" : "#f44336",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      maxWidth: "90vw",
      textAlign: "center",
    });

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(-50%) translateY(-20px)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPreviewContent = (paste: Paste) => {
    if (paste.type === 'multi-tab' && paste.tabs) {
      const firstTabWithContent = paste.tabs.find(tab => tab.content.trim());
      return firstTabWithContent?.content || '';
    }
    return paste.content || '';
  };

  const getMainLanguage = (paste: Paste) => {
    if (paste.type === 'multi-tab' && paste.tabs) {
      const firstTabWithContent = paste.tabs.find(tab => tab.content.trim());
      return firstTabWithContent?.language || 'text';
    }
    return paste.language || 'text';
  };

  if (!currentUser) {
    return (
      <div className="my-pastes-page">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="logo" onClick={() => navigate('/')}>InstaBin</h1>
            </div>
            <div className="header-right">
              <UserMenu onOpenAuth={handleOpenAuth} />
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="auth-required">
            <h2>Sign in to manage your pastes</h2>
            <p>Create an account or sign in to track and organize your code snippets.</p>
            <div className="auth-buttons">
              <button 
                onClick={() => handleOpenAuth('login')}
                className="auth-btn primary"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleOpenAuth('signup')}
                className="auth-btn secondary"
              >
                Create Account
              </button>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
          onSwitchMode={handleSwitchAuthMode}
        />
      </div>
    );
  }

  return (
    <div className="my-pastes-page">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo" onClick={() => navigate('/')}>InstaBin</h1>
            <h2 className="page-title">My Pastes</h2>
          </div>
          <div className="header-right">
            <UserMenu onOpenAuth={handleOpenAuth} />
          </div>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your pastes...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchUserPastes} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : pastes.length === 0 ? (
          <div className="empty-state">
            <h3>No pastes yet</h3>
            <p>Create your first paste to see it here.</p>
            <button 
              onClick={() => navigate('/')}
              className="create-btn"
            >
              Create New Paste
            </button>
          </div>
        ) : (
          <div className="pastes-grid">
            {pastes.map((paste) => (
              <div key={paste.id} className="paste-card">
                <div className="paste-header">
                  <h3 className="paste-title">{paste.title}</h3>
                  <div className="paste-meta">
                    <span className="paste-type">
                      {paste.type === 'multi-tab' ? `${paste.tabs?.length} tabs` : getMainLanguage(paste)}
                    </span>
                    <span className={`paste-visibility ${paste.isPublic ? 'public' : 'private'}`}>
                      {paste.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>

                <div className="paste-preview">
                  <code>{getPreviewContent(paste).slice(0, 150)}...</code>
                </div>

                <div className="paste-stats">
                  <span>Views: {paste.views}</span>
                  <span>Created: {formatDate(paste.createdAt)}</span>
                </div>

                <div className="paste-actions">
                  <button 
                    onClick={() => window.open(`/${paste.id}`, '_blank')}
                    className="action-btn view"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleToggleVisibility(paste.id, paste.isPublic)}
                    className="action-btn visibility"
                  >
                    {paste.isPublic ? 'Make Private' : 'Make Public'}
                  </button>
                  <button 
                    onClick={() => handleDeletePaste(paste.id)}
                    className="action-btn delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={handleSwitchAuthMode}
      />
    </div>
  );
};

export default MyPastesPage;