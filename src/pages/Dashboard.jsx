import React from 'react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  return (
    <motion.div 
      className="dashboard-page glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem', borderRadius: '1rem' }}
    >
      <h2 className="gradient-text">Analytics Dashboard</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
        Detailed analytics and charts will go here.
      </p>
    </motion.div>
  );
};

export default Dashboard;
