import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Layout from './components/Layout';
import ParticlesBackground from './components/ParticlesBackground';
import AssistantBadge from './components/AssistantBadge';

// Pages
import Splash from './pages/Splash';
import Home from './pages/Home';
import Translator from './pages/Translator';
import Generator from './pages/Generator';
import Dataset from './pages/Dataset';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Login from './pages/Login';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />

        {/* Main layout wrapper */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/dataset" element={<Dataset />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <ParticlesBackground />
      {/* Arabic Pattern Background */}
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
