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
  Printer
} from 'lucide-react';
import './Merchant.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Merchant = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'add'
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('gave'); // 'gave' or 'got'

  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load merchants on mount
  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchTransactions = async (merchantId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant-transactions/${merchantId}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant`);
      const data = await response.json();
      if (data.success) {
        setMerchants(data.data);
      }
    } catch (error) {
      console.error("Error fetching merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const overallOutstanding = merchants.reduce((acc, m) => acc + (m.balance || 0), 0);

  const handleAddMerchant = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const phone = e.target.phone.value;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: name,
          contactNumber: phone
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setMerchants([data.data, ...merchants]);
        setActiveTab('payment');
        e.target.reset();
      } else {
        alert("Failed to add merchant: " + data.message);
      }
    } catch (error) {
      console.error("Error adding merchant:", error);
      alert("Error adding merchant");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    const date = e.target.date.value;
    const cropName = e.target.crop.value;
    const description = e.target.description.value;
    const billNo = e.target.billNo.value;

    const payload = {
      merchantId: selectedMerchant._id,
      type: txnType,
      amount,
      date,
      cropName,
      description,
      billNo
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        // Refresh transactions and merchants (to get updated balance)
        await fetchTransactions(selectedMerchant._id);
        await fetchMerchants();
        
        // Update local selected merchant balance for immediate UI feedback
        setSelectedMerchant(prev => ({
          ...prev,
          balance: txnType === 'gave' ? (prev.balance || 0) + amount : (prev.balance || 0) - amount
        }));

        setShowTxnModal(false);
      } else {
        alert("Failed to add transaction: " + data.message);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error adding transaction");
    } finally {
      setLoading(false);
    }
  };

  const deleteMerchant = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this merchant? All their transactions will be lost.")) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setMerchants(merchants.filter(m => m._id !== id));
        alert(data.message);
      } else {
        alert("Failed to delete merchant: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting merchant:", error);
      alert("Error deleting merchant");
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction? Balance will be reverted.")) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant-transactions/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        // Refresh transactions and merchants (to get updated balance)
        await fetchTransactions(selectedMerchant._id);
        await fetchMerchants();
        
        // Refresh the selected merchant object to reflect new balance
        const updatedMerchantResponse = await fetch(`${API_BASE_URL}/api/merchant`);
        const mData = await updatedMerchantResponse.json();
        if (mData.success) {
          const updated = mData.data.find(m => m._id === selectedMerchant._id);
          if (updated) setSelectedMerchant(updated);
        }

        alert(data.message);
      } else {
        alert("Failed to delete transaction: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction");
    } finally {
      setLoading(false);
    }
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
    <div className="merchant-container">
      <div className="merchant-tabs hide-on-print">
        <button 
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payment'); setSelectedMerchant(null); clearDateRange(); }}
        >
          Merchant Payment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Merchant
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'payment' && !selectedMerchant && (
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

            <div className="merchant-list">
              {loading && merchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading merchants...</div>
              ) : merchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No merchants found. Add one to get started.</div>
              ) : (
                merchants.map(merchant => (
                  <div 
                    key={merchant._id} 
                    className="merchant-item"
                    onClick={() => {
                      setSelectedMerchant(merchant);
                      fetchTransactions(merchant._id);
                    }}
                  >
                    <div className="merchant-info">
                      <h3>{merchant.merchantName}</h3>
                      <p>{merchant.contactNumber || 'No contact'}</p>
                    </div>
                    <div className="merchant-balance">
                      <span className="balance-label">{(merchant.balance || 0) >= 0 ? 'You Get' : 'You Give'}</span>
                      <span className={`amount ${(merchant.balance || 0) >= 0 ? 'negative' : 'positive'}`}>
                        ₹{Math.abs(merchant.balance || 0).toLocaleString()}
                      </span>
                      <button 
                        className="delete-merchant-btn"
                        onClick={(e) => deleteMerchant(e, merchant._id)}
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

        {selectedMerchant && activeTab === 'payment' && (
          <motion.div 
            key="account"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="account-view"
          >
            {/* Print Header */}
            <div className="print-only-header">
              <div className="firm-identity">
                <h1>Tanmay Traders</h1>
                <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
                <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim | Mo: 9011874112</p>
              </div>
              <div className="print-report-title">
                <h2>Merchant Account Ledger Statement</h2>
                <p className="print-date">Merchant: <strong>{selectedMerchant.merchantName}</strong></p>
                {selectedMerchant.contactNumber && <p className="print-date">Contact: {selectedMerchant.contactNumber}</p>}
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
                <button className="back-btn" onClick={() => { setSelectedMerchant(null); clearDateRange(); }}>
                  <ArrowLeft size={24} />
                </button>
                <div className="account-title">
                  <h2>{selectedMerchant.merchantName}</h2>
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
              const activeNetVal = showFiltered ? (rangeTotalGave - rangeTotalGot) : (selectedMerchant.balance || 0);

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
                              .sort((a, b) => (b._id || b.id).localeCompare(a._id || a.id))
                              .map(txn => (
                                <div key={txn._id || txn.id} className="transaction-card-new">
                                  <div className="txn-info-col">
                                    <div className="txn-time">{formatTime(txn.date, txn.createdAt)}</div>
                                    <div className="txn-desc">{txn.description || (txn.type === 'gave' ? 'You Gave' : 'You Got')}</div>
                                    {txn.cropName && <div className="txn-crop-tag"><Tag size={10} style={{ marginRight: '4px' }} /> {txn.cropName}</div>}
                                    {txn.billNo && <div className="txn-bill-no" style={{ fontSize: '0.75rem', color: '#ef6c00', background: '#fff3e0', width: 'fit-content', padding: '1px 6px', borderRadius: '4px', fontWeight: '600', marginTop: '4px' }}>Bill No: {txn.billNo}</div>}
                                  </div>
                                  
                                  <div className={`txn-amount-col gave ${txn.type === 'gave' ? 'active' : ''}`}>
                                    {txn.type === 'gave' && `₹ ${txn.amount.toLocaleString()}`}
                                  </div>
                                  
                                  <div className={`txn-amount-col got ${txn.type === 'got' ? 'active' : ''}`}>
                                    {txn.type === 'got' && `₹ ${txn.amount.toLocaleString()}`}
                                    <button 
                                      className="delete-txn-btn-abs hide-on-print"
                                      onClick={() => deleteTransaction(txn._id || txn.id)}
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ))
                    )}
                  </div>

                  <div className="account-footer hide-on-print">
                    <button 
                      className="btn-gave"
                      onClick={() => { setTxnType('gave'); setShowTxnModal(true); }}
                    >
                      तुम्ही दिले ₹
                    </button>
                    <button 
                      className="btn-got"
                      onClick={() => { setTxnType('got'); setShowTxnModal(true); }}
                    >
                      तुम्हाला मिळाले ₹
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
            className="add-merchant-container"
          >
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ background: '#e8f5e9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <UserPlus size={30} color="#2e7d32" />
              </div>
              <h2>Add New Merchant</h2>
              <p style={{ color: '#888' }}>Enter merchant details to start tracking payments</p>
            </div>
            <form onSubmit={handleAddMerchant}>
              <div className="form-group">
                <label>Merchant Name *</label>
                <input type="text" name="name" placeholder="Enter name" required />
              </div>
              <div className="form-group">
                <label>Contact Number (Optional)</label>
                <input type="tel" name="phone" placeholder="Enter mobile number" />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Merchant'}
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
                <div className="form-group">
                  <label><Calendar size={16} /> Date</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label><Tag size={16} /> Crop Name</label>
                  <input type="text" name="crop" placeholder="e.g. Wheat, Rice" required />
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

export default Merchant;
