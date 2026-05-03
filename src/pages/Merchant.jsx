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
  UserPlus
} from 'lucide-react';
import './Merchant.css';

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
      const response = await fetch(`https://tanmay-traders.vercel.app/api/merchant-transactions/${merchantId}`);
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
      const response = await fetch('https://tanmay-traders.vercel.app/api/merchant');
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
      const response = await fetch('https://tanmay-traders.vercel.app/api/merchant', {
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
      const response = await fetch('https://tanmay-traders.vercel.app/api/merchant-transactions', {
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

  return (
    <div className="merchant-container">
      <div className="merchant-tabs">
        <button 
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payment'); setSelectedMerchant(null); }}
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
                <div className={`amount ${overallOutstanding >= 0 ? 'positive' : 'negative'}`}>
                  ₹{Math.abs(overallOutstanding).toLocaleString()}
                  <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                    {overallOutstanding >= 0 ? ' (You Get)' : ' (You Owe)'}
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
                      <span className={`amount ${(merchant.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ₹{Math.abs(merchant.balance || 0).toLocaleString()}
                      </span>
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
            <div className="account-header">
              <button className="back-btn" onClick={() => setSelectedMerchant(null)}>
                <ArrowLeft size={24} />
              </button>
              <div className="account-title">
                <h2>{selectedMerchant.merchantName}</h2>
              </div>
            </div>

            <div className="account-summary">
              <div className="summary-label">Net Balance</div>
              <div className={`amount ${(selectedMerchant.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                ₹{Math.abs(selectedMerchant.balance || 0).toLocaleString()}
                <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                  {(selectedMerchant.balance || 0) >= 0 ? ' (You Get)' : ' (You Give)'}
                </span>
              </div>
            </div>

            <div className="transaction-list">
              {transactions
                .filter(t => t.merchantId === selectedMerchant._id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(txn => (
                  <div key={txn.id} className="transaction-card">
                    <div className="txn-details">
                      <div className="txn-date">
                        <Calendar size={12} style={{ marginRight: '5px' }} />
                        {txn.date}
                      </div>
                      <h4>{txn.description || (txn.type === 'gave' ? 'You Gave' : 'You Got')}</h4>
                      {txn.cropName && <div className="txn-crop"><Tag size={12} /> {txn.cropName}</div>}
                      {txn.billNo && <div className="txn-bill" style={{ fontSize: '0.8rem', color: '#888' }}>Bill No: {txn.billNo}</div>}
                    </div>
                    <div className={`txn-amount ${txn.type === 'got' ? 'positive' : 'negative'}`}>
                      ₹{txn.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>

            <div className="account-footer">
              <button 
                className="btn-gave"
                onClick={() => { setTxnType('gave'); setShowTxnModal(true); }}
              >
                YOU GAVE ₹
              </button>
              <button 
                className="btn-got"
                onClick={() => { setTxnType('got'); setShowTxnModal(true); }}
              >
                YOU GOT ₹
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
