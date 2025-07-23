import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import UserMenu from '../components/UserMenu';
import AuthModal from '../components/AuthModal';
import './ProfileSettingsPage.css';

const ProfileSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'danger'>('profile');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  if (!currentUser) {
    return (
      <div className="profile-settings-page">
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
            <h2>Sign in to access settings</h2>
            <p>Please sign in to manage your profile settings.</p>
            <div className="auth-buttons">
              <button onClick={() => handleOpenAuth('login')} className="auth-btn primary">
                Sign In
              </button>
              <button onClick={() => handleOpenAuth('signup')} className="auth-btn secondary">
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

  const clearMessage = () => {
    setMessage({ text: '', type: 'success' });
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(clearMessage, 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    clearMessage();

    try {
      await updateProfile(currentUser, {
        displayName: displayName.trim() || null
      });
      showMessage('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Profile update error:', error);
      showMessage(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;

    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    clearMessage();

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('Password updated successfully!', 'success');
    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to update password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.email) return;

    const confirmMessage = 'Are you sure you want to delete your account? This action cannot be undone and will delete all your pastes.';
    if (!window.confirm(confirmMessage)) return;

    const password = window.prompt('Please enter your current password to confirm account deletion:');
    if (!password) return;

    setLoading(true);
    clearMessage();

    try {
      // Re-authenticate user before deleting account
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Delete user account
      await deleteUser(currentUser);
      
      // Navigate to home page
      navigate('/');
      showMessage('Account deleted successfully', 'success');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      
      let errorMessage = 'Failed to delete account';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign back in, then try again';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isGoogleUser = currentUser.providerData.some(provider => provider.providerId === 'google.com');

  return (
    <div className="profile-settings-page">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo" onClick={() => navigate('/')}>InstaBin</h1>
            <h2 className="page-title">Profile Settings</h2>
          </div>
          <div className="header-right">
            <UserMenu onOpenAuth={handleOpenAuth} />
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="settings-container">
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
              Profile
            </button>
            
            {!isGoogleUser && (
              <button
                className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Security
              </button>
            )}

            <button
              className={`nav-item ${activeSection === 'danger' ? 'active' : ''} danger`}
              onClick={() => setActiveSection('danger')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6H5H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Danger Zone
            </button>
          </nav>

          <div className="settings-content">
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
                <button onClick={clearMessage} className="message-close">×</button>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="settings-section">
                <h3>Profile Information</h3>
                <p className="section-description">
                  Update your account profile information.
                </p>

                <form onSubmit={handleUpdateProfile} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={currentUser.email || ''}
                      disabled
                      className="form-input disabled"
                    />
                    <small className="form-help">Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className="form-input"
                      maxLength={50}
                    />
                    <small className="form-help">This name will be shown in your profile</small>
                  </div>

                  <div className="form-group">
                    <label>Account Type</label>
                    <div className="account-type">
                      {isGoogleUser ? (
                        <span className="provider-badge google">
                          <svg width="16" height="16" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                          </svg>
                          Google Account
                        </span>
                      ) : (
                        <span className="provider-badge email">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Email Account
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="form-button primary"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'security' && !isGoogleUser && (
              <div className="settings-section">
                <h3>Change Password</h3>
                <p className="section-description">
                  Update your password to keep your account secure.
                </p>

                <form onSubmit={handleChangePassword} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="form-input"
                    />
                    <small className="form-help">Must be at least 6 characters long</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="form-button primary"
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'danger' && (
              <div className="settings-section danger-section">
                <h3>Danger Zone</h3>
                <p className="section-description">
                  Irreversible and destructive actions.
                </p>

                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="form-button danger"
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
};

export default ProfileSettingsPage;