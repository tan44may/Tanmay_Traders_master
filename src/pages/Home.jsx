import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Tractor, DollarSign, TrendingUp } from 'lucide-react';
import './Home.css';

const StatCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div 
    className="stat-card glass-panel"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
  >
    <div className="stat-icon">
      <Icon size={24} color="var(--primary-green)" />
    </div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </motion.div>
);

const Home = () => {
  return (
    <div className="dashboard-container">
      <motion.div 
        className="hero-section glass-panel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <motion.h1 
            className="gradient-text"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Tanmay Traders
          </motion.h1>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your trusted Farm Crop Commission Agent in Karanja (Lad), Washim.
            Specializing in Soybean, Cotton, Tur, and all types of grains.
          </motion.p>
        </div>
        <div className="hero-animation">
          <motion.div 
            className="hero-tractor"
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Tractor size={100} color="var(--primary-green)" strokeWidth={1} />
          </motion.div>
        </div>
      </motion.div>

      <div className="stats-grid">
        <StatCard title="Today's Arrivals" value="124 Quintals" icon={Tractor} delay={0.2} />
        <StatCard title="Active Merchants" value="45" icon={Sprout} delay={0.3} />
        <StatCard title="Today's Turnover" value="₹ 5,40,000" icon={DollarSign} delay={0.4} />
        <StatCard title="Market Trend" value="Up 2.4%" icon={TrendingUp} delay={0.5} />
      </div>

      <motion.div 
        className="recent-activity glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3>Recent Transactions</h3>
        <div className="activity-list">
          {[1, 2, 3].map((item) => (
            <motion.div 
              key={item} 
              className="activity-item"
              whileHover={{ x: 10, backgroundColor: 'rgba(76, 175, 80, 0.05)' }}
            >
              <div className="activity-icon">
                <Sprout size={16} color="var(--primary-light)" />
              </div>
              <div className="activity-details">
                <p className="activity-title">Soybean purchased from Ramesh Farmer</p>
                <p className="activity-time">2 hours ago</p>
              </div>
              <div className="activity-amount">
                + ₹ 45,000
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
