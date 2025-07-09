import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import PeerExchange from './pages/PeerExchange';
import EducatorDashboard from './pages/EducatorDashboard';
import CourseDetail from './pages/CourseDetail';

function App() {
  useEffect(() => {
    // Suppress specific console errors that are expected in development
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Suppress known ICP development errors
        if (message.includes('Failed to fetch') || 
            message.includes('NetworkError') ||
            message.includes('ERR_CONNECTION_REFUSED') ||
            message.includes('400 (Bad Request)')) {
          return; // Suppress these errors
        }
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route path="/educator" element={<EducatorDashboard />} />
            <Route path="/peer-exchange" element={<PeerExchange />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;