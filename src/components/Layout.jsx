import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = () => {
  const location = useLocation();
  const isFullWidth = ['/home', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen pt-24 flex flex-col items-center w-full">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className={`w-full flex-1 flex flex-col ${isFullWidth ? '' : 'max-w-full px-0 pb-12'}`}
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default Layout;
