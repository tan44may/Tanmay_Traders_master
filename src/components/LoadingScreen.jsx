import React from 'react';
import { motion } from 'framer-motion';
import { Tractor, Sprout, Sun } from 'lucide-react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
  return (
    <motion.div 
      className="loading-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.8, ease: "easeInOut" } }}
      onAnimationComplete={() => {
        // Just a safety in case we want to trigger something on exit complete
      }}
    >
      <div className="loading-background">
        <motion.div 
          className="sun"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Sun size={120} color="#FFD54F" strokeWidth={1.5} />
        </motion.div>

        <div className="farm-ground"></div>
        <div className="farm-ground-light"></div>

        <motion.div
          className="tractor-container"
          initial={{ x: '-100%' }}
          animate={{ x: '100vw' }}
          transition={{ duration: 3, ease: "linear", onComplete: onComplete }}
        >
          <Tractor size={80} color="#2E7D32" strokeWidth={1.5} />
          <motion.div 
            className="exhaust-smoke"
            animate={{ 
              opacity: [0, 0.5, 0],
              y: [0, -20, -40],
              x: [0, -10, 0],
              scale: [1, 1.5, 2]
            }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </motion.div>

        <div className="crops-container">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, duration: 0.5, type: 'spring' }}
            >
              <Sprout size={40} color="#4CAF50" strokeWidth={2} />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div 
        className="loading-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <h1 className="gradient-text">Tanmay Traders</h1>
        <p>Loading Farm Essentials...</p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
