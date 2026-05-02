import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // In a real app, clear tokens here
    navigate('/');
  };

  return (
    <div className="navbar glass-panel">
      <div className="navbar-left">
        <motion.button 
          className="menu-btn" 
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Menu size={24} color="var(--text-dark)" />
        </motion.button>
        <h2 className="navbar-title">Tanmay Traders</h2>
      </div>

      <div className="navbar-right">
        <motion.button 
          className="dashboard-link-btn"
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Dashboard
        </motion.button>
        
        <motion.button 
          className="icon-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell size={20} color="var(--text-dark)" />
          <span className="badge"></span>
        </motion.button>
        
        <div className="user-profile">
          <div className="avatar">
            <User size={20} color="white" />
          </div>
          <span className="username">Tanmay</span>
        </div>

        <motion.button 
          className="signout-btn" 
          onClick={handleSignOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Navbar;
