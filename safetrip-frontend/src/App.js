import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import SOS from './pages/SOS';
import Dashboard from './pages/Dashboard';
import SafetyTips from './pages/SafetyTips';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/routing/PrivateRoute';
import UserRoute from './components/routing/UserRoute';
import AuthorityRoute from './components/routing/AuthorityRoute';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* User-only routes */}
              <Route
                path="/sos"
                element={
                  <UserRoute>
                    <SOS />
                  </UserRoute>
                }
              />
              <Route
                path="/safety-tips"
                element={
                  <UserRoute>
                    <SafetyTips />
                  </UserRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <UserRoute>
                    <Profile />
                  </UserRoute>
                }
              />
              
              {/* Authority-only routes */}
              <Route
                path="/dashboard"
                element={
                  <AuthorityRoute>
                    <Dashboard />
                  </AuthorityRoute>
                }
              />
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
