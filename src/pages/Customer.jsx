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
  Clock,
  Printer
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

  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateDisplayLong = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  const filteredTransactions = (Array.isArray(transactions) ? transactions : []).filter(t => {
    const tDate = t.date?.split('T')[0] || t.date;
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  });

  const overallTotalGave = (Array.isArray(transactions) ? transactions : []).reduce((acc, txn) => txn.type === 'gave' ? acc + txn.amount : acc, 0);
  const overallTotalGot = (Array.isArray(transactions) ? transactions : []).reduce((acc, txn) => txn.type === 'got' ? acc + txn.amount : acc, 0);

  const rangeTotalGave = filteredTransactions.reduce((acc, txn) => txn.type === 'gave' ? acc + txn.amount : acc, 0);
  const rangeTotalGot = filteredTransactions.reduce((acc, txn) => txn.type === 'got' ? acc + txn.amount : acc, 0);

  return (
    <div className="customer-container">
      <div className="customer-tabs hide-on-print">
        <button 
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payment'); setSelectedCustomer(null); clearDateRange(); }}
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
            {/* Print Only Header */}
            <div className="print-only-header">
              <div className="firm-identity">
                <h1>Tanmay Traders</h1>
                <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
                <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim | Mo: 9011874112</p>
              </div>
              <div className="print-report-title">
                <h2>Customer Account Ledger Statement</h2>
                <p className="print-date">Customer: <strong>{selectedCustomer.customerName}</strong></p>
                {selectedCustomer.contactNumber && <p className="print-date">Contact: {selectedCustomer.contactNumber}</p>}
                <p className="print-date">
                  Period: <strong>{startDate || endDate ? `${startDate ? formatDateDisplayLong(startDate) : 'Start'} to ${endDate ? formatDateDisplayLong(endDate) : 'End'}` : 'All Transactions'}</strong>
                </p>
                <p className="print-date" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Printed on: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div className="account-header hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button className="back-btn" onClick={() => { setSelectedCustomer(null); clearDateRange(); }}>
                  <ArrowLeft size={24} />
                </button>
                <div className="account-title">
                  <h2>{selectedCustomer.customerName}</h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn-gave"
                  onClick={() => { setTxnType('gave'); setShowTxnModal(true); }}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.95rem', width: 'auto' }}
                >
                  You Gave ₹
                </button>
                <button 
                  className="btn-got"
                  onClick={() => { setTxnType('got'); setShowTxnModal(true); }}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.95rem', width: 'auto' }}
                >
                  You Got ₹
                </button>
                <button 
                  className="print-btn"
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                >
                  <Printer size={18} />
                  <span>PDF / Print</span>
                </button>
              </div>
            </div>

            {/* Date Range Selector Panel */}
            <div className="date-range-panel hide-on-print" style={{ background: '#fcfcfd', border: '1px solid #eef0f2', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#4a5568' }}>
                <Calendar size={16} />
                <span>Filter Transactions by Date Range</span>
              </div>
              <div className="inputs-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '150px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#718096', textTransform: 'uppercase' }}>Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.9rem' }} />
                </div>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '150px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#718096', textTransform: 'uppercase' }}>End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.9rem' }} />
                </div>
                <div className="buttons-group">
                  {(startDate || endDate) && (
                    <button className="clear-btn" onClick={clearDateRange} style={{ padding: '8px 15px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                      Clear Range
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(() => {
              const showFiltered = startDate || endDate;
              const activeTotalGave = showFiltered ? rangeTotalGave : overallTotalGave;
              const activeTotalGot = showFiltered ? rangeTotalGot : overallTotalGot;
              const activeNetVal = showFiltered ? (rangeTotalGave - rangeTotalGot) : (ledger ? ledger.netBalance : (selectedCustomer.balance || 0));
              return (
                <>
                  <div className="account-summary-three-col">
                    <div className="summary-item gave">
                      <div className="summary-label">{showFiltered ? 'Range Total Gave' : 'Total Gave'}</div>
                      <div className="amount">₹{activeTotalGave.toLocaleString()}</div>
                    </div>
                    <div className="summary-item got">
                      <div className="summary-label">{showFiltered ? 'Range Total Got' : 'Total Got'}</div>
                      <div className="amount">₹{activeTotalGot.toLocaleString()}</div>
                    </div>
                    <div className={`summary-item net ${activeNetVal >= 0 ? 'negative' : 'positive'}`}>
                      <div className="summary-label">{showFiltered ? 'Range Net Balance' : 'Net Balance'}</div>
                      <div className="amount">
                        ₹{Math.abs(activeNetVal).toLocaleString()}
                        <span className="balance-indicator">
                          {activeNetVal >= 0 ? ' (Get)' : ' (Give)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="account-body-split">
                    {/* Left Column: Transaction Entries */}
                    <div className="ledger-col">
                      <div className="transaction-list">
                        <div className="txn-list-header">
                          <div className="header-info">Entries ({filteredTransactions.length})</div>
                          <div className="header-amount">You Gave</div>
                          <div className="header-amount">You Got</div>
                        </div>
                        {filteredTransactions.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No entries found in this period.</div>
                        ) : (
                          Object.keys(filteredTransactions
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
                                {filteredTransactions
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
                                            className="delete-txn-btn-abs hide-on-print"
                                            onClick={(e) => { e.stopPropagation(); deleteTransaction(txn._id); }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ))
                        )}
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
                            <span className={`net-outstanding-amount ${activeNetVal >= 0 ? 'negative' : 'positive'}`}>
                              ₹{Math.abs(activeNetVal).toLocaleString()}
                              <small>{activeNetVal >= 0 ? ' (Get)' : ' (Give)'}</small>
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
