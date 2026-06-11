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

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Customer = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'add'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('gave'); // 'gave' or 'got'

  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchTransactions = async (customerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customer-transactions/${customerId}`);
      const data = await response.json();
      if (data?.success && data?.data) {
        setTransactions(data.data.transactions || []);
        setLedger(data.data.ledger || null);
      } else {
        setTransactions([]);
        setLedger(null);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
      setLedger(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customer`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(`${API_BASE_URL}/api/customer`, {
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
      const response = await fetch(`${API_BASE_URL}/api/customer-transactions`, {
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
      const response = await fetch(`${API_BASE_URL}/api/customer/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/customer-transactions/${id}`, {
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
                <div className={`amount ${overallOutstanding >= 0 ? 'negative' : 'positive'}`}>
                  ₹{Math.abs(overallOutstanding).toLocaleString()}
                  <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                    {overallOutstanding >= 0 ? ' (You Get)' : ' (You Give)'}
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
                      <span className={`amount ${(customer.balance || 0) >= 0 ? 'negative' : 'positive'}`}>
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

            {(() => {
              const netVal = ledger ? ledger.netBalance : (selectedCustomer.balance || 0);
              return (
                <>
                  <div className="account-summary-three-col">
                    <div className="summary-item gave">
                      <div className="summary-label">Total Gave</div>
                      <div className="amount">₹{transactions.reduce((acc, txn) => txn.type === 'gave' ? acc + txn.amount : acc, 0).toLocaleString()}</div>
                    </div>
                    <div className="summary-item got">
                      <div className="summary-label">Total Got</div>
                      <div className="amount">₹{transactions.reduce((acc, txn) => txn.type === 'got' ? acc + txn.amount : acc, 0).toLocaleString()}</div>
                    </div>
                    <div className={`summary-item net ${netVal >= 0 ? 'negative' : 'positive'}`}>
                      <div className="summary-label">Net Balance</div>
                      <div className="amount">
                        ₹{Math.abs(netVal).toLocaleString()}
                        <span className="balance-indicator">
                          {netVal >= 0 ? ' (Get)' : ' (Give)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="account-body-split">
                    {/* Left Column: Transaction Entries */}
                    <div className="ledger-col">
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
                                  return (
                                    <div 
                                      key={txn._id} 
                                      className="transaction-card-new simple-entry"
                                    >
                                      <div className="txn-info-col">
                                        <div className="txn-time">{formatTime(txn.date, txn.createdAt)}</div>
                                        <div className="txn-desc">
                                          {txn.description || (txn.type === 'gave' ? 'You Gave' : 'You Got')}
                                        </div>
                                        {txn.type === 'gave' && txn.interestRate > 0 && (
                                          <div className="txn-rate-badge">
                                            <Percent size={10} style={{ marginRight: '2px' }} />
                                            {txn.interestRate}% Interest
                                          </div>
                                        )}
                                        {txn.billNo && (
                                          <div className="txn-bill-no">
                                            Bill No: {txn.billNo}
                                          </div>
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
                    </div>

                    {/* Right Column: Interest Ledger Breakdown */}
                    <div className="interest-col">
                      <div className="interest-ledger-card">
                        <div className="card-header-premium">
                          <Percent size={18} className="header-icon" />
                          <h3>Outstanding Loans & Interest</h3>
                        </div>

                        <div className="card-body-premium">
                          {ledger?.activeLoans && ledger.activeLoans.length > 0 ? (
                            <div className="active-loans-list">
                              {ledger.activeLoans.map((loan, idx) => (
                                <div key={loan._id || idx} className="active-loan-item">
                                  <div className="loan-item-header">
                                    <span className="loan-badge">Loan #{ledger.activeLoans.length - idx}</span>
                                    <span className="loan-date">{formatDate(loan.date)}</span>
                                  </div>
                                  
                                  <div className="loan-details-grid">
                                    <div className="detail-row">
                                      <span className="label">Original Amount:</span>
                                      <span className="value">₹{loan.originalAmount.toLocaleString()}</span>
                                    </div>
                                    {loan.currentPrincipal !== loan.originalAmount && (
                                      <div className="detail-row">
                                        <span className="label text-highlight">Remaining Principal:</span>
                                        <span className="value text-highlight">₹{loan.currentPrincipal.toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="detail-row">
                                      <span className="label">Interest Rate:</span>
                                      <span className="value">{loan.interestRate}% / month</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="label">Duration:</span>
                                      <span className="value flex-row"><Clock size={12} style={{marginRight: '4px'}} /> {loan.duration}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="label text-purple">Accrued Interest:</span>
                                      <span className="value text-purple">+ ₹{loan.interestAmount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="loan-item-footer">
                                    <span>Outstanding Balance:</span>
                                    <span className="total-owed-amount">₹{loan.totalAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-loans-state">
                              <div className="empty-icon-wrapper">
                                <IndianRupee size={32} />
                              </div>
                              {ledger?.prepayment > 0 ? (
                                <>
                                  <h4>Prepayment Credit Balance</h4>
                                  <p className="prepayment-text">The customer has a prepayment credit of <strong style={{color: '#2e7d32'}}>₹{ledger.prepayment.toLocaleString()}</strong>.</p>
                                </>
                              ) : (
                                <>
                                  <h4>No Active Loans</h4>
                                  <p>No outstanding amounts. All loans have been fully paid off.</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="card-footer-premium">
                          <div className="summary-row">
                            <span>Total Unpaid Principal:</span>
                            <strong>₹{(ledger?.totalPrincipal || 0).toLocaleString()}</strong>
                          </div>
                          <div className="summary-row">
                            <span>Total Accrued Interest:</span>
                            <strong className="text-purple">₹{(ledger?.totalInterest || 0).toLocaleString()}</strong>
                          </div>
                          {ledger?.prepayment > 0 && (
                            <div className="summary-row">
                              <span>Prepayment Credit:</span>
                              <strong style={{color: '#2e7d32'}}>- ₹{ledger.prepayment.toLocaleString()}</strong>
                            </div>
                          )}
                          <div className="summary-row final-total">
                            <span>Net Outstanding:</span>
                            <span className={`net-outstanding-amount ${netVal >= 0 ? 'negative' : 'positive'}`}>
                              ₹{Math.abs(netVal).toLocaleString()}
                              <small>{netVal >= 0 ? ' (Get)' : ' (Give)'}</small>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                </>
              );
            })()}
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
