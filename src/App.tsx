import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './api';
import type { User } from './api';
import Login from './components/Login';
import Signup from './components/Signup';
import Projects from './components/Projects';
import ProjectIssues from './components/ProjectIssues';
import IssueDetail from './components/IssueDetail';
import Profile from './components/Profile';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/projects" /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/signup"
            element={
              user ? <Navigate to="/projects" /> : <Signup onSignup={handleLogin} />
            }
          />
          <Route
            path="/projects"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Projects />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/projects/:projectId/issues"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <ProjectIssues />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/issues/:issueId"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <IssueDetail />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Profile />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/" element={<Navigate to={user ? "/projects" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
