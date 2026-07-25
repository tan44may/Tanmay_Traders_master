import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Tractor, DollarSign, TrendingUp, Users, Building, Coins, Receipt } from 'lucide-react';
import './Home.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const StatCard = ({ title, value, icon: Icon, delay, subText }) => (
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
      {subText && <span className="stat-subtext">{subText}</span>}
    </div>
  </motion.div>
);

const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mascotState, setMascotState] = useState('walk-in'); // 'walk-in', 'greet', 'walk-off', 'done'

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/dashboard-stats`);
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Mascot Welcome Speech (Plays welcome_marathi.mp3 if present, falls back to TTS)
  const playWelcomeSpeech = () => {
    const audio = new Audio('/welcome_marathi.mp3');
    
    // Set up exit state when audio finishes playing
    audio.onended = () => {
      setMascotState('walk-off');
    };

    audio.play()
      .then(() => {
        console.log("Success: Playing local welcome_marathi.mp3 voice recording.");
      })
      .catch((error) => {
        console.log("Local welcome_marathi.mp3 not found or blocked. Falling back to browser SpeechSynthesis.");
        triggerTTS();
      });
  };

  // Browser SpeechSynthesis Fallback Trigger
  const triggerTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const greetingText = "तन्मय ट्रेडर्स मध्ये तुमचे स्वागत आहे";
      const utterance = new SpeechSynthesisUtterance(greetingText);
      utterance.lang = 'mr-IN';
      utterance.rate = 0.82;
      utterance.pitch = 0.95;

      const triggerSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => 
          v.lang.toLowerCase().replace('_', '-').startsWith('mr') || 
          v.lang.toLowerCase().replace('_', '-').startsWith('hi')
        );

        if (selectedVoice) {
          console.log("Selected TTS Fallback Voice:", selectedVoice.name);
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
          setMascotState('walk-off');
        };
        utterance.onerror = () => {
          setMascotState('walk-off');
        };

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        triggerSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = triggerSpeak;
      }
    } else {
      setTimeout(() => {
        setMascotState('walk-off');
      }, 3000);
    }
  };

  // Trigger speech when mascot enters center screen ('greet' state)
  useEffect(() => {
    if (mascotState === 'greet') {
      playWelcomeSpeech();
      
      // Safety timeout: if both audio & TTS fail, exit mascot in 5 seconds
      const safetyTimer = setTimeout(() => {
        setMascotState(prev => prev === 'greet' ? 'walk-off' : prev);
      }, 5000);

      return () => clearTimeout(safetyTimer);
    }
  }, [mascotState]);

  const formatActivityTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Mascot Overlay */}
      <AnimatePresence>
        {mascotState !== 'done' && (
          <motion.div 
            className="farmer-welcome-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div 
              className={`farmer-walking-wrapper ${mascotState === 'walk-in' || mascotState === 'walk-off' ? 'walking' : ''}`}
              initial={{ x: '-150vw', y: '10%' }}
              animate={
                mascotState === 'walk-in' ? { x: '0vw', y: '10%' } :
                mascotState === 'greet' ? { x: '0vw', y: '10%' } :
                mascotState === 'walk-off' ? { x: '150vw', y: '10%' } : { x: '150vw' }
              }
              transition={{ 
                duration: 1.5,
                ease: "easeOut"
              }}
              onAnimationComplete={() => {
                if (mascotState === 'walk-in') {
                  setMascotState('greet');
                } else if (mascotState === 'walk-off') {
                  setMascotState('done');
                }
              }}
            >
              <img 
                src="/farmer_mascot.png" 
                alt="Welcome Farmer" 
                className={`farmer-img ${mascotState === 'walk-in' || mascotState === 'walk-off' ? 'walking' : ''}`} 
              />

              <AnimatePresence>
                {mascotState === 'greet' && (
                  <motion.div 
                    className="speech-bubble"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    तन्मय ट्रेडर्स मध्ये तुमचे स्वागत आहे! 🙏🌾
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading dashboard stats...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard 
              title="Today's Arrivals" 
              value={`${stats?.todayArrivalsQty || 0} Quintals`} 
              icon={Tractor} 
              delay={0.1}
              subText="Soybean, Cotton, & Grains"
            />
            <StatCard 
              title="Today's Sales Value" 
              value={`₹ ${(stats?.todaySalesTurnover || 0).toLocaleString('en-IN')}`} 
              icon={Coins} 
              delay={0.2}
              subText="Patti transactions registered"
            />
            <StatCard 
              title="Today's Purchases Value" 
              value={`₹ ${(stats?.todayPurchasesTurnover || 0).toLocaleString('en-IN')}`} 
              icon={DollarSign} 
              delay={0.3}
              subText="Merchant bills logged today"
            />
            <StatCard 
              title="Crops & Commission" 
              value={`${stats?.cropVarietiesCount || 0} Crop Types`} 
              icon={TrendingUp} 
              delay={0.4}
              subText={`Total commission earned: ₹ ${(stats?.todayCommissions || 0).toLocaleString('en-IN')}`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }} className="responsive-dashboard-grid">
            {/* Recent Activities */}
            <motion.div 
              className="recent-activity glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3>Recent Transactions Feed</h3>
              <div className="activity-list">
                {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No transactions recorded yet.</div>
                ) : (
                  stats.recentActivity.map((activity) => (
                    <motion.div 
                      key={activity.id} 
                      className="activity-item"
                      whileHover={{ x: 10, backgroundColor: 'rgba(76, 175, 80, 0.05)' }}
                    >
                      <div className="activity-icon">
                        {activity.icon === 'receipt' ? <Receipt size={16} color="#0284c7" /> : <Sprout size={16} color="var(--primary-light)" />}
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">{activity.title}</p>
                        <p className="activity-desc" style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>{activity.description}</p>
                        <p className="activity-time" style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{formatActivityTime(activity.time)}</p>
                      </div>
                      <div className="activity-amount" style={{ fontWeight: '700', color: activity.type === 'patti' ? '#d32f2f' : '#2e7d32' }}>
                        ₹ {activity.amount.toLocaleString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Quick Contacts / Accounts Summary Cards */}
            <motion.div 
              className="recent-activity glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <h3>Quick Contacts Database</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} color="#2e7d32" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Active Customers</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Total registered farmers</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', alignSelf: 'center' }}>
                    {stats?.activeCustomersCount || 0}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building size={20} color="#1976d2" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Active Merchants</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Wholesale traders & buyers</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', alignSelf: 'center' }}>
                    {stats?.activeMerchantsCount || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
