import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, onSwitchMode }) => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showForgotPassword) {
      await handleForgotPassword();
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      onClose();
      resetForm();
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      onClose();
      resetForm();
    } catch (error: any) {
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in was cancelled.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    setError('');
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchMode = () => {
    resetForm();
    onSwitchMode();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose}>
          ×
        </button>

        <div className="auth-modal-content">
          <h2 className="auth-modal-title">
            {showForgotPassword 
              ? 'Reset Password' 
              : mode === 'login' 
                ? 'Welcome Back' 
                : 'Create Account'
            }
          </h2>
          
          {resetEmailSent ? (
            <div className="reset-email-sent">
              <p>Password reset email sent! Check your inbox.</p>
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                }}
                className="auth-button secondary"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>

                {!showForgotPassword && (
                  <>
                    {mode === 'signup' && (
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Display Name (optional)"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="auth-input"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                      />
                    </div>

                    {mode === 'signup' && (
                      <div className="form-group">
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="auth-input"
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button primary"
                >
                  {loading ? 'Loading...' : 
                   showForgotPassword ? 'Send Reset Email' :
                   mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {!showForgotPassword && (
                <>
                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="auth-button google"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="auth-links">
                    {mode === 'login' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="auth-link"
                        >
                          Forgot Password?
                        </button>
                        <p>
                          Don't have an account?{' '}
                          <button onClick={handleSwitchMode} className="auth-link">
                            Sign Up
                          </button>
                        </p>    
                      </>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <button onClick={handleSwitchMode} className="auth-link">
                          Sign In
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}

              {showForgotPassword && (
                <div className="auth-links">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="auth-link"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;