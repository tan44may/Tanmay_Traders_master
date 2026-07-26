import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  Clock, 
  AlertTriangle,
  FolderDot,
  Calculator
} from 'lucide-react';
import './Investments.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Investments = () => {
  const [activeTab, setActiveTab] = useState('RD'); // 'RD' or 'FD'
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Local Popup alert states
  const [maturityAlertsList, setMaturityAlertsList] = useState([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [hasCheckedAlerts, setHasCheckedAlerts] = useState(false);

  // Form states
  const [accountNumber, setAccountNumber] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/investments`);
      const data = await response.json();
      if (data.success) {
        setInvestments(data.data || []);
        
        // Trigger checking for tomorrow maturities on load
        if (!hasCheckedAlerts && data.data) {
          checkMaturityAlerts(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMaturityAlerts = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Filter items maturing tomorrow (using date comparison in local time)
    const tomorrowMaturities = items.filter(item => {
      const mDate = new Date(item.maturityDate);
      mDate.setHours(0, 0, 0, 0);
      return mDate.getTime() === tomorrow.getTime();
    });

    if (tomorrowMaturities.length > 0) {
      setMaturityAlertsList(tomorrowMaturities);
      setShowAlertPopup(true);
    }
    setHasCheckedAlerts(true);
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!accountNumber || !investAmount || !maturityAmount || !maturityDate) {
      alert('All fields are required.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentType: activeTab,
          accountNumber,
          investAmount: parseFloat(investAmount),
          maturityAmount: parseFloat(maturityAmount),
          maturityDate
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedList = [...investments, data.data].sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));
        setInvestments(updatedList);
        setShowModal(false);
        resetForm();
        
        // Re-evaluate alert list if a tomorrow maturity is added
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const addedMaturityDate = new Date(data.data.maturityDate);
        addedMaturityDate.setHours(0, 0, 0, 0);

        if (addedMaturityDate.getTime() === tomorrow.getTime()) {
          setMaturityAlertsList(prev => [...prev, data.data]);
          setShowAlertPopup(true);
        }
      } else {
        alert(data.message || 'Failed to add investment.');
      }
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('Error adding investment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment entry?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/investments/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setInvestments(investments.filter(item => item._id !== id));
        setMaturityAlertsList(maturityAlertsList.filter(item => item._id !== id));
      } else {
        alert(data.message || 'Failed to delete investment.');
      }
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('Error deleting investment.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAccountNumber('');
    setInvestAmount('');
    setMaturityAmount('');
    setMaturityDate('');
  };

  // Filter and sort items based on type. Backend returns them sorted, but we ensure sorting and filtering here too.
  const filteredInvestments = investments
    .filter(item => item.investmentType === activeTab)
    .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));

  // Helper to determine status badge
  const getStatusBadge = (item) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const mDate = new Date(item.maturityDate);
    mDate.setHours(0,0,0,0);

    const diffTime = mDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="status-badge matured">Matured</span>;
    } else if (diffDays === 1) {
      return (
        <span className="status-badge maturing-tomorrow pulse-animation">
          <AlertTriangle size={12} style={{ marginRight: '4px' }} />
          Maturing Tomorrow
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="status-badge maturing-today pulse-animation">
          Maturing Today
        </span>
      );
    } else {
      return <span className="status-badge active">Active ({diffDays} days left)</span>;
    }
  };

  // Calculate statistics for cards
  const activeRd = investments.filter(i => i.investmentType === 'RD');
  const activeFd = investments.filter(i => i.investmentType === 'FD');

  const totalRdMonthly = activeRd.reduce((acc, curr) => acc + curr.investAmount, 0);
  const totalFdPrincipal = activeFd.reduce((acc, curr) => acc + curr.investAmount, 0);
  
  const totalRdMaturityValue = activeRd.reduce((acc, curr) => acc + curr.maturityAmount, 0);
  const totalFdMaturityValue = activeFd.reduce((acc, curr) => acc + curr.maturityAmount, 0);

  return (
    <div className="investments-container content-area">
      {/* Header section */}
      <div className="investments-header">
        <div>
          <h2 className="gradient-text flex-row-gap">
            <TrendingUp size={28} className="text-green" /> Investments
          </h2>
          <p className="subtitle">Manage Recurring Deposits (RD) and Fixed Deposits (FD) portfolios</p>
        </div>
        <div className="header-actions">
          <button className="add-investment-trigger-btn" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} />
            <span>Add New {activeTab}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <motion.div 
          className="stat-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="stat-icon-wrapper rd-icon">
            <Calculator size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">RD Portfolio</span>
            <h3 className="stat-value">{activeRd.length} Active</h3>
            <span className="stat-subtext">Total Monthly: ₹{totalRdMonthly.toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Maturity Value: ₹{totalRdMaturityValue.toLocaleString('en-IN')}</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="stat-icon-wrapper fd-icon">
            <FolderDot size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">FD Portfolio</span>
            <h3 className="stat-value">{activeFd.length} Active</h3>
            <span className="stat-subtext">Total Invested: ₹{totalFdPrincipal.toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Maturity Value: ₹{totalFdMaturityValue.toLocaleString('en-IN')}</span>
          </div>
        </motion.div>
      </div>

      {/* Navigation tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'RD' ? 'active' : ''}`}
          onClick={() => setActiveTab('RD')}
        >
          Recurring Deposit (RD)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'FD' ? 'active' : ''}`}
          onClick={() => setActiveTab('FD')}
        >
          Fixed Deposit (FD)
        </button>
      </div>

      {/* Data display grid */}
      <motion.div 
        className="glass-panel table-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {loading && filteredInvestments.length === 0 ? (
          <div className="empty-state">Loading investment entries...</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="empty-state">
            No {activeTab} accounts registered. Click "Add New {activeTab}" to get started.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="investments-table">
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>{activeTab === 'RD' ? 'Monthly Investment' : 'Invested Amount'}</th>
                  <th>Maturity Amount</th>
                  <th>Maturity Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredInvestments.map((item) => (
                    <motion.tr 
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      <td className="account-number-cell">
                        <strong>{item.accountNumber}</strong>
                      </td>
                      <td>
                        <div className="price-tag">
                          <IndianRupee size={14} />
                          <span>{item.investAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td>
                        <div className="price-tag maturity-price">
                          <IndianRupee size={14} />
                          <span>{item.maturityAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="date-cell">
                        <Calendar size={14} className="cell-icon" />
                        <span>
                          {new Date(item.maturityDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteInvestment(item._id)}
                          title={`Delete ${activeTab}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add New Investment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-container glass-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="modal-header">
              <h3>Add New {activeTab} Account</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddInvestment} className="investment-form">
              <div className="form-group">
                <label>{activeTab} Account Number *</label>
                <input 
                  type="text" 
                  value={accountNumber} 
                  onChange={(e) => setAccountNumber(e.target.value)} 
                  placeholder="e.g. 501004322998"
                  required 
                />
              </div>

              <div className="form-group">
                <label>
                  {activeTab === 'RD' ? 'Investment Amount Per Month *' : 'Total Investment Amount *'}
                </label>
                <div className="input-with-icon">
                  <IndianRupee size={16} className="input-icon" />
                  <input 
                    type="number" 
                    value={investAmount} 
                    onChange={(e) => setInvestAmount(e.target.value)} 
                    placeholder="e.g. 10000"
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Maturity Amount *</label>
                <div className="input-with-icon">
                  <IndianRupee size={16} className="input-icon" />
                  <input 
                    type="number" 
                    value={maturityAmount} 
                    onChange={(e) => setMaturityAmount(e.target.value)} 
                    placeholder="e.g. 125000"
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Maturity Date *</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input 
                    type="date" 
                    value={maturityDate} 
                    onChange={(e) => setMaturityDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : `Add ${activeTab}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* In-App Maturity Alert Popup Modal */}
      {showAlertPopup && (
        <div className="modal-overlay alert-modal-overlay">
          <motion.div 
            className="modal-container glass-panel alert-modal-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="modal-header alert-modal-header">
              <h3 className="flex-row-gap alert-title">
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
                className="save-btn close-alert-btn" 
                onClick={() => setShowAlertPopup(false)}
              >
                Acknowledge & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Investments;
