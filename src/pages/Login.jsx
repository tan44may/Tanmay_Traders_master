import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, User, Wheat } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'tanmay' && password === '9011874112') {
      navigate('/home');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <motion.div 
          className="bg-element leaf-1"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf size={120} color="rgba(76, 175, 80, 0.1)" strokeWidth={1} />
        </motion.div>
        <motion.div 
          className="bg-element wheat-1"
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wheat size={150} color="rgba(129, 199, 132, 0.1)" strokeWidth={1} />
        </motion.div>
      </div>

      <motion.div 
        className="login-card glass-panel"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <div className="login-header">
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="logo-circle">
              <Wheat size={40} color="#FFFFFF" strokeWidth={2} />
            </div>
          </motion.div>
          <h2 className="gradient-text">Tanmay Traders</h2>
          <p>Farm Crop Commission Agent</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}
          
          <div className="input-group">
            <div className="input-icon">
              <User size={20} color="var(--text-muted)" />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <Lock size={20} color="var(--text-muted)" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button 
            type="submit" 
            className="login-btn"
            whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow)' }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
