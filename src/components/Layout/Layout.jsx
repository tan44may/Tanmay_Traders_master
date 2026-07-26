import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [maturityAlertsList, setMaturityAlertsList] = useState([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Run global maturity alert check once per session when the app opens
    const hasChecked = sessionStorage.getItem('hasCheckedMaturityToday');
    if (!hasChecked) {
      fetchMaturityAlerts();
    }
  }, []);

  const fetchMaturityAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments`);
      const data = await response.json();
      if (data.success && data.data) {
        checkMaturity(data.data);
      }
    } catch (error) {
      console.error('Error fetching global maturity alerts:', error);
    }
  };

  const checkMaturity = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Filter items maturing tomorrow in local time
    const tomorrowMaturities = items.filter(item => {
      const mDate = new Date(item.maturityDate);
      mDate.setHours(0, 0, 0, 0);
      return mDate.getTime() === tomorrow.getTime();
    });

    if (tomorrowMaturities.length > 0) {
      setMaturityAlertsList(tomorrowMaturities);
      setShowAlertPopup(true);
    }
    // Mark as checked for this session
    sessionStorage.setItem('hasCheckedMaturityToday', 'true');
  };

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Global Maturity Alert Popup Modal */}
      <AnimatePresence>
        {showAlertPopup && (
          <div className="alert-modal-overlay">
            <motion.div 
              className="alert-modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="alert-modal-header">
                <h3 className="alert-title">
                  <AlertTriangle size={24} className="text-warning-red" /> Maturity Alert!
                </h3>
                <button className="close-modal" onClick={() => setShowAlertPopup(false)}>&times;</button>
              </div>
              
              <div className="alert-modal-body">
                <p className="alert-modal-intro">
                  The following investment accounts are maturing <strong>tomorrow</strong>. Please take note:
                </p>
                <div className="alert-items-list">
                  {maturityAlertsList.map((item) => (
                    <div key={item._id} className="alert-item-card">
                      <div className="alert-item-head">
                        <span className={`alert-badge-type ${item.investmentType.toLowerCase()}`}>
                          {item.investmentType}
                        </span>
                        <span className="alert-acc-no">A/C: {item.accountNumber}</span>
                      </div>
                      <div className="alert-item-body">
                        <div>
                          <span className="lbl">Monthly/Invested:</span>
                          <span className="val">₹{item.investAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="lbl">Maturity Value:</span>
                          <span className="val text-green-bold">₹{item.maturityAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="lbl">Maturity Date:</span>
                          <span className="val">
                            {new Date(item.maturityDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="close-alert-btn" 
                  onClick={() => setShowAlertPopup(false)}
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
