import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Building, 
  DollarSign, 
  Calendar, 
  FileText,
  UserPlus
} from 'lucide-react';
import './Bank.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Bank = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'add'
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Transaction Modal State
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('credit'); // 'credit' (deposit) or 'debit' (withdrawal)
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);

  // Load accounts on mount
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bank`);
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch transactions for selected account
  const fetchTransactions = async (accountId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/transactions/${accountId}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Add a new Bank Account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bankName = formData.get('bankName');
    const accountHolderName = formData.get('accountHolderName');
    const accountNumber = formData.get('accountNumber');
    const ifscCode = formData.get('ifscCode');
    const branchName = formData.get('branchName');
    const initialBalance = formData.get('initialBalance');

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountHolderName,
          accountNumber,
          ifscCode,
          branchName,
          initialBalance
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAccounts();
        setActiveTab('payment');
        e.target.reset();
      } else {
        alert(data.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete Bank Account
  const deleteAccount = async (e, accountId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this bank account and all its transactions?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/${accountId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        if (selectedAccount && selectedAccount._id === accountId) {
          setSelectedAccount(null);
        }
        await fetchAccounts();
      } else {
        alert(data.message || 'Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
  };

  // Add Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txnAmount || Number(txnAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bank/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: selectedAccount._id,
          type: txnType,
          amount: Number(txnAmount),
          date: txnDate,
          description: txnDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh selected account details to show updated balance
        const accResponse = await fetch(`${API_BASE_URL}/api/bank`);
        const accData = await accResponse.json();
        if (accData.success) {
          setAccounts(accData.data || []);
          const updatedAcc = accData.data.find(a => a._id === selectedAccount._id);
          if (updatedAcc) {
            setSelectedAccount(updatedAcc);
          }
        }

        await fetchTransactions(selectedAccount._id);
        setShowTxnModal(false);
        setTxnAmount('');
        setTxnDescription('');
        setTxnDate(new Date().toISOString().split('T')[0]);
      } else {
        alert(data.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete Transaction
  const deleteTransaction = async (txnId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/transactions/${txnId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        // Refresh account details and transactions
        const accResponse = await fetch(`${API_BASE_URL}/api/bank`);
        const accData = await accResponse.json();
        if (accData.success) {
          setAccounts(accData.data || []);
          const updatedAcc = accData.data.find(a => a._id === selectedAccount._id);
          if (updatedAcc) {
            setSelectedAccount(updatedAcc);
          }
        }
        await fetchTransactions(selectedAccount._id);
      } else {
        alert(data.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const formatDate = (dateStr) => {
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

  // Calculate Overall Net Bank Balance
  const overallBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  return (
    <div className="bank-container">
      <div className="bank-tabs">
        <button 
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payment'); setSelectedAccount(null); }}
        >
          Bank Accounts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Bank Account
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'payment' && !selectedAccount && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="overall-summary">
              <div className="summary-card">
                <h4>Total Bank Balance</h4>
                <div className={`amount ${overallBalance >= 0 ? 'positive' : 'negative'}`}>
                  ₹{overallBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bank-list">
              {loading && accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading bank accounts...</div>
              ) : accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No bank accounts found. Add one to get started.</div>
              ) : (
                accounts.map(account => (
                  <div 
                    key={account._id} 
                    className="bank-item"
                    onClick={() => {
                      setSelectedAccount(account);
                      fetchTransactions(account._id);
                    }}
                  >
                    <div className="bank-info">
                      <div className="bank-logo-circle">
                        <Building size={20} />
                      </div>
                      <div>
                        <h3>{account.bankName}</h3>
                        <p>{account.accountNumber ? `A/C: ${account.accountNumber}` : 'No A/C Number'} • {account.accountHolderName || 'No Name'}</p>
                      </div>
                    </div>
                    <div className="bank-balance">
                      <span className="balance-label">Current Balance</span>
                      <span className={`amount ${(account.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ₹{(account.balance || 0).toLocaleString()}
                      </span>
                      <button 
                        className="delete-bank-btn"
                        onClick={(e) => deleteAccount(e, account._id)}
                        title="Delete Bank Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'payment' && selectedAccount && (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="account-view"
          >
            <div className="account-header">
              <button className="back-btn" onClick={() => setSelectedAccount(null)}>
                <ArrowLeft size={24} />
              </button>
              <div className="account-title">
                <h2>{selectedAccount.bankName}</h2>
                <span className="subtitle">
                  {selectedAccount.accountNumber ? `A/C: ${selectedAccount.accountNumber}` : ''} 
                  {selectedAccount.ifscCode ? ` • IFSC: ${selectedAccount.ifscCode}` : ''}
                </span>
              </div>
            </div>

            <div className="account-summary-three-col">
              <div className="summary-item got">
                <div className="summary-label">Total Deposit / जमा</div>
                <div className="amount">
                  ₹{transactions.reduce((acc, txn) => txn.type === 'credit' ? acc + txn.amount : acc, 0).toLocaleString()}
                </div>
              </div>
              <div className="summary-item gave">
                <div className="summary-label">Total Withdraw / नावे</div>
                <div className="amount">
                  ₹{transactions.reduce((acc, txn) => txn.type === 'debit' ? acc + txn.amount : acc, 0).toLocaleString()}
                </div>
              </div>
              <div className={`summary-item net ${(selectedAccount.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                <div className="summary-label">Current Balance</div>
                <div className="amount">
                  ₹{(selectedAccount.balance || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="transaction-list">
              <div className="txn-list-header">
                <div className="header-info">Transactions</div>
                <div className="header-amount text-red">Withdraw (नावे)</div>
                <div className="header-amount text-green">Deposit (जमा)</div>
              </div>
              {Object.keys(transactions
                .filter(t => t.bankAccountId === selectedAccount._id)
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
                      .filter(t => t.bankAccountId === selectedAccount._id && (t.date?.split('T')[0] || t.date) === date)
                      .sort((a, b) => (b._id || b.id).localeCompare(a._id || a.id))
                      .map(txn => (
                        <div key={txn._id || txn.id} className="transaction-card-new">
                          <div className="txn-info-col">
                            <div className="txn-time">{formatTime(txn.date, txn.createdAt)}</div>
                            <div className="txn-desc">{txn.description || (txn.type === 'credit' ? 'Deposit' : 'Withdrawal')}</div>
                          </div>
                          
                          <div className={`txn-amount-col gave ${txn.type === 'debit' ? 'active' : ''}`}>
                            {txn.type === 'debit' && `₹ ${txn.amount.toLocaleString()}`}
                          </div>
                          
                          <div className={`txn-amount-col got ${txn.type === 'credit' ? 'active' : ''}`}>
                            {txn.type === 'credit' && `₹ ${txn.amount.toLocaleString()}`}
                            <button 
                              className="delete-txn-btn-abs"
                              onClick={() => deleteTransaction(txn._id || txn.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>

            <div className="account-footer">
              <button 
                className="btn-got"
                onClick={() => { setTxnType('credit'); setShowTxnModal(true); }}
              >
                Deposit / जमा ₹
              </button>
              <button 
                className="btn-gave"
                onClick={() => { setTxnType('debit'); setShowTxnModal(true); }}
              >
                Withdraw / नावे ₹
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
            className="add-account-container"
          >
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ background: '#e8f5e9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <UserPlus size={30} color="#2e7d32" />
              </div>
              <h2>Add New Bank Account</h2>
              <p style={{ color: '#888' }}>Enter bank account details to start tracking ledger</p>
            </div>
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label>Bank Name *</label>
                <input type="text" name="bankName" placeholder="e.g. State Bank of India" required />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" name="accountHolderName" placeholder="Enter account holder name" />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" name="accountNumber" placeholder="Enter account number" />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" name="ifscCode" placeholder="Enter IFSC code" />
              </div>
              <div className="form-group">
                <label>Branch Name</label>
                <input type="text" name="branchName" placeholder="Enter branch name" />
              </div>
              <div className="form-group">
                <label>Initial Balance (₹)</label>
                <input type="number" name="initialBalance" placeholder="0.00" defaultValue="0" />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Bank Account'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      {showTxnModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-modal">
            <h3>Add {txnType === 'credit' ? 'Deposit (जमा)' : 'Withdrawal (नावे)'} Entry</h3>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input 
                    type="number" 
                    value={txnAmount} 
                    onChange={(e) => setTxnAmount(e.target.value)} 
                    placeholder="Enter amount" 
                    required 
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input 
                    type="date" 
                    value={txnDate} 
                    onChange={(e) => setTxnDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description / Remarks</label>
                <div className="input-with-icon">
                  <FileText size={18} />
                  <input 
                    type="text" 
                    value={txnDescription} 
                    onChange={(e) => setTxnDescription(e.target.value)} 
                    placeholder="e.g. Received from customer, cash withdrawal" 
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowTxnModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bank;
