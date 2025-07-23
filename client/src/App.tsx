import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ViewPage from './pages/ViewPage';
import MyPastesPage from './pages/MyPastesPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-pastes" element={
              <ProtectedRoute>
                <MyPastesPage />
              </ProtectedRoute>
            } />
            <Route path="/profile-settings" element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/:id" element={<ViewPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;