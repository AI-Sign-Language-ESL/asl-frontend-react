import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/Layout';
import ParticlesBackground from './components/ParticlesBackground';
import AssistantBadge from './components/AssistantBadge';

import Splash from './pages/Splash';
import Home from './pages/Home';
import Translator from './pages/Translator';
import Generator from './pages/Generator';
import Dataset from './pages/Dataset';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Meeting from './pages/Meeting';

import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route
            path="/translator"
            element={
              <ProtectedRoute>
                <Translator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generator"
            element={
              <ProtectedRoute>
                <Generator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dataset"
            element={
              <ProtectedRoute>
                <Dataset />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <Meeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <Meeting />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/login"
          element={
            <Login />
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <ParticlesBackground />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] -z-10"
        style={{
          backgroundImage: "url('/arabic-pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "600px auto",
          filter: "invert(var(--pattern-invert))"
        }}
      />
      <AnimatedRoutes />
      <AssistantBadge />
    </Router>
  );
}