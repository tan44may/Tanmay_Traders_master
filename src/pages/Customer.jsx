import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  Tag, 
  FileText, 
  ChevronRight,
  UserPlus,
  Trash2,
  Percent,
  Clock
} from 'lucide-react';
import './Customer.css';

const Customer = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'add'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('gave'); // 'gave' or 'got'
  const [expandedTxn, setExpandedTxn] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchTransactions = async (customerId) => {
    try {
      setLoading(true);
      const response = await fetch(`https://tanmay-traders.vercel.app/api/customer-transactions/${customerId}`);
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://tanmay-traders.vercel.app/api/customer');
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetBalance = (txns, baseBalance) => {
    if (!txns || txns.length === 0) return baseBalance || 0;
    return txns.reduce((acc, txn) => {
      const amount = txn.type === 'gave' ? (txn.interestDetails?.totalAmount || txn.amount) : txn.amount;
      return acc + (txn.type === 'gave' ? amount : -amount);
    }, 0);
  };

  const overallOutstanding = Array.isArray(customers) 
    ? customers.reduce((acc, c) => acc + (c.balance || 0), 0) 
    : 0;

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const phone = e.target.phone.value;
    
    try {
      setLoading(true);
      const response = await fetch('https://tanmay-traders.vercel.app/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, contactNumber: phone })
      });
      if (response.ok) {
        fetchCustomers();
        setActiveTab('payment');
        e.target.reset();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    const date = e.target.date.value;
    const interestRate = txnType === 'gave' ? parseFloat(e.target.interestRate?.value || 0) : 0;
    const description = e.target.description.value;
    const billNo = e.target.billNo.value;

    if (!amount || isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://tanmay-traders.vercel.app/api/customer-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          type: txnType,
          amount,
          interestRate,
          description,
          billNo,
          date: date ? new Date(date).toISOString() : new Date().toISOString()
        })
      });

      if (response.ok) {
        fetchTransactions(selectedCustomer._id);
        fetchCustomers(); // Refresh balances
        setShowTxnModal(false);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const response = await fetch(`https://tanmay-traders.vercel.app/api/customer/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const response = await fetch(`https://tanmay-traders.vercel.app/api/customer-transactions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTransactions(selectedCustomer._id);
        fetchCustomers(); // Refresh balance
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Helper Functions
  const calculateDuration = (startDate) => {
    const start = new Date(startDate);
    const end = new Date();
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    return { months, days };
  };

  const calculateInterest = (amount, rate, duration) => {
    // Interest = Amount * (Rate/100) * (Months + Days/30)
    const totalMonths = duration.months + (duration.days / 30);
    return Math.round(amount * (rate / 100) * totalMonths);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (dateStr, createdAt) => {
    const source = createdAt || dateStr;
    if (!source) return '';
    try {
      const date = new Date(source);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="customer-container">
      <div className="customer-tabs">
        <button 
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payment'); setSelectedCustomer(null); }}
        >
          Customer Payment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Customer
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'payment' && !selectedCustomer && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="overall-summary">
              <div className="summary-card">
                <h4>Overall Outstanding</h4>
                <div className={`amount ${overallOutstanding >= 0 ? 'positive' : 'negative'}`}>
                  ₹{Math.abs(overallOutstanding).toLocaleString()}
                  <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                    {overallOutstanding >= 0 ? ' (You Get)' : ' (You Owe)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="customer-list">
              {loading && customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading customers...</div>
              ) : customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No customers found. Add one to get started.</div>
              ) : (
                customers.map(customer => (
                  <div 
                    key={customer._id} 
                    className="customer-item"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      fetchTransactions(customer._id);
                    }}
                  >
                    <div className="customer-info">
                      <h3>{customer.customerName}</h3>
                      <p>{customer.contactNumber || 'No contact'}</p>
                    </div>
                    <div className="customer-balance">
                      <span className="balance-label">{(customer.balance || 0) >= 0 ? 'You Get' : 'You Give'}</span>
                      <span className={`amount ${(customer.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ₹{Math.abs(customer.balance || 0).toLocaleString()}
                      </span>
                      <button 
                        className="delete-customer-btn"
                        onClick={(e) => deleteCustomer(e, customer._id)}
                        style={{ marginLeft: '15px', color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={18} style={{ marginLeft: '10px', color: '#ccc' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {selectedCustomer && activeTab === 'payment' && (
          <motion.div 
            key="account"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="account-view"
          >
            <div className="account-header">
              <button className="back-btn" onClick={() => setSelectedCustomer(null)}>
                <ArrowLeft size={24} />
              </button>
              <div className="account-title">
                <h2>{selectedCustomer.customerName}</h2>
              </div>
            </div>

            <div className="account-summary-three-col">
              <div className="summary-item gave">
                <div className="summary-label">Total Gave</div>
                <div className="amount">₹{transactions.reduce((acc, txn) => txn.type === 'gave' ? acc + (txn.interestDetails?.totalAmount || txn.amount) : acc, 0).toLocaleString()}</div>
              </div>
              <div className="summary-item got">
                <div className="summary-label">Total Got</div>
                <div className="amount">₹{transactions.reduce((acc, txn) => txn.type === 'got' ? acc + txn.amount : acc, 0).toLocaleString()}</div>
              </div>
              <div className={`summary-item net ${calculateNetBalance(transactions, selectedCustomer.balance) >= 0 ? 'positive' : 'negative'}`}>
                <div className="summary-label">Net Balance</div>
                <div className="amount">
                  ₹{Math.abs(calculateNetBalance(transactions, selectedCustomer.balance)).toLocaleString()}
                  <span className="balance-indicator">
                    {calculateNetBalance(transactions, selectedCustomer.balance) >= 0 ? ' (Get)' : ' (Give)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="transaction-list">
              <div className="txn-list-header">
                <div className="header-info">Entries</div>
                <div className="header-amount">You Gave</div>
                <div className="header-amount">You Got</div>
              </div>
              {Object.keys((Array.isArray(transactions) ? transactions : [])
                .reduce((groups, txn) => {
                  const date = txn.date?.split('T')[0] || txn.date;
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(txn);
                  return groups;
                }, {}))
                .sort((a, b) => new Date(b) - new Date(a))
                .map(date => (
                  <div key={date} className="date-group">
                    <div className="date-divider">
                      <span>{formatDate(date)}</span>
                    </div>
                    {transactions
                      .filter(t => (t.date?.split('T')[0] || t.date) === date)
                      .map(txn => {
                        const duration = calculateDuration(txn.date);
                        const interestAmount = calculateInterest(txn.amount, txn.interestRate || 0, duration);
                        const totalAmount = txn.amount + interestAmount;
                        const isExpanded = expandedTxn === txn._id;

                        return (
                          <div 
                            key={txn._id} 
                            className="transaction-card-new"
                            onClick={() => setExpandedTxn(isExpanded ? null : txn._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="txn-info-col">
                              <div className="txn-time">{formatTime(txn.date, txn.createdAt)}</div>
                              <div className="txn-desc">

                                {txn.description || (txn.type === 'gave' ? 'You Gave' : 'You Got')}
                              </div>
                              
                              {isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="txn-interest-details"
                                >
                                  <div className="interest-item">
                                    <span className="interest-label">Base Amount</span>
                                    <span className="interest-value">₹{txn.amount.toLocaleString()}</span>
                                  </div>
                                  {txn.type === 'gave' && (
                                    <>
                                      <div className="interest-item">
                                        <span className="interest-label">Interest Rate</span>
                                        <span className="interest-value">{txn.interestRate || 0}% / month</span>
                                      </div>
                                      <div className="interest-item">
                                        <span className="interest-label">Duration</span>
                                        <span className="interest-value">
                                          {txn.interestDetails?.duration || `${duration.months} months ${duration.days} days`}
                                        </span>
                                      </div>
                                      <div className="interest-item">
                                        <span className="interest-label">Interest Amount</span>
                                        <span className="interest-value">₹{(txn.interestDetails?.interestAmount || interestAmount).toLocaleString()}</span>
                                      </div>
                                      <div className="interest-item" style={{ gridColumn: 'span 2', borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '5px' }}>
                                        <span className="interest-label">Total Amount</span>
                                        <span className="interest-value" style={{ fontSize: '1rem', color: '#512da8' }}>
                                          ₹{(txn.interestDetails?.totalAmount || totalAmount).toLocaleString()}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </div>
                            
                            <div className={`txn-amount-col gave ${txn.type === 'gave' ? 'active' : ''}`}>
                              {txn.type === 'gave' && `₹ ${txn.amount.toLocaleString()}`}
                            </div>
                            
                            <div className={`txn-amount-col got ${txn.type === 'got' ? 'active' : ''}`}>
                              {txn.type === 'got' && `₹ ${txn.amount.toLocaleString()}`}
                              <button 
                                className="delete-txn-btn-abs"
                                onClick={(e) => { e.stopPropagation(); deleteTransaction(txn._id); }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>

            <div className="account-footer">
              <button 
                className="btn-gave"
                onClick={() => { setTxnType('gave'); setShowTxnModal(true); }}
              >
                You Gave ₹
              </button>
              <button 
                className="btn-got"
                onClick={() => { setTxnType('got'); setShowTxnModal(true); }}
              >
                You Got ₹
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'add' && (
          <motion.div 
            key="add"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="add-customer-container"
          >
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ background: '#f3e5f5', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <UserPlus size={30} color="#512da8" />
              </div>
              <h2>Add New Customer</h2>
              <p style={{ color: '#888' }}>Enter customer details to start tracking loans</p>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input type="text" name="name" placeholder="Enter name" required />
              </div>
              <div className="form-group">
                <label>Contact Number (Optional)</label>
                <input type="tel" name="phone" placeholder="Enter mobile number" />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Customer'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      {showTxnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className={`modal-header ${txnType}`}>
              <h3>Add Entry: {txnType === 'gave' ? 'You Gave' : 'You Got'}</h3>
              <button className="close-btn" onClick={() => setShowTxnModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddTransaction}>
                <div className="form-group">
                  <label><IndianRupee size={16} /> Amount</label>
                  <input type="number" name="amount" placeholder="0.00" required autoFocus />
                </div>
                {txnType === 'gave' && (
                  <div className="form-group">
                    <label><Percent size={16} /> Interest Rate (% per month)</label>
                    <input type="number" name="interestRate" step="0.01" placeholder="e.g. 2.0" defaultValue="0" />
                  </div>
                )}
                <div className="form-group">
                  <label><Calendar size={16} /> Date</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label><FileText size={16} /> Description (Optional)</label>
                  <input type="text" name="description" placeholder="Add a note" />
                </div>
                <div className="form-group">
                  <label><FileText size={16} /> Bill No (Optional)</label>
                  <input type="text" name="billNo" placeholder="Bill number" />
                </div>
                <button type="submit" className={`submit-btn ${txnType}`}>Save Entry</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
