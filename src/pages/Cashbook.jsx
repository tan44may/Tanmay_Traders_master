import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Plus, 
  Trash2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import './Cashbook.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Cashbook = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    date: '',
    openingBalance: 0,
    green: {
      bankSelfDebits: { amount: 0, list: [] },
      commission: { amount: 0, list: [] },
      bankCredits: { amount: 0, list: [] },
      customerGot: { amount: 0, list: [] },
      manualDeposits: { amount: 0, list: [] },
      rdWithdrawals: { amount: 0, list: [] }
    },
    red: {
      bills: { amount: 0, list: [] },
      bankCreditsOffset: { amount: 0, list: [] },
      customerGave: { amount: 0, list: [] },
      manualWithdrawals: { amount: 0, list: [] },
      rdDeposits: { amount: 0, list: [] }
    }
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('deposit'); // 'deposit' or 'withdrawal'
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAmount, setEntryAmount] = useState('');

  // Accordion details toggle state
  const [expandedSection, setExpandedSection] = useState({
    bankSelfDebits: false,
    commission: false,
    bankCredits: false,
    customerGot: false,
    manualDeposits: true,
    rdWithdrawals: false,
    bills: false,
    bankCreditsOffset: false,
    customerGave: false,
    manualWithdrawals: true,
    rdDeposits: false
  });

  const toggleExpand = (section) => {
    setExpandedSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchCashbookData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cashbook?date=${selectedDate}`);
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching cashbook:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashbookData();
  }, [selectedDate]);

  // Navigate date
  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Add manual entry
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryDesc || !entryAmount || Number(entryAmount) <= 0) {
      alert('Please fill in valid description and amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cashbook/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          type: modalType,
          description: entryDesc,
          amount: Number(entryAmount)
        })
      });
      const result = await response.json();
      if (result.success) {
        setEntryDesc('');
        setEntryAmount('');
        setShowModal(false);
        await fetchCashbookData();
      } else {
        alert(result.message || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete manual entry
  const handleDeleteEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this manual entry?')) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cashbook/entry/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        await fetchCashbookData();
      } else {
        alert(result.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setLoading(false);
    }
  };

  // Totals calculations
  const opening = data.openingBalance || 0;
  
  const greenSelfDebits = data.green?.bankSelfDebits?.amount || 0;
  const greenCommission = data.green?.commission?.amount || 0;
  const greenBankCredits = data.green?.bankCredits?.amount || 0;
  const greenCustomerGot = data.green?.customerGot?.amount || 0;
  const greenManual = data.green?.manualDeposits?.amount || 0;
  const greenRD = data.green?.rdWithdrawals?.amount || 0;

  const redBills = data.red?.bills?.amount || 0;
  const redBankCredits = data.red?.bankCreditsOffset?.amount || 0;
  const redCustomerGave = data.red?.customerGave?.amount || 0;
  const redManual = data.red?.manualWithdrawals?.amount || 0;
  const redRD = data.red?.rdDeposits?.amount || 0;

  const totalGreen = opening + greenSelfDebits + greenCommission + greenBankCredits + greenCustomerGot + greenManual + greenRD;
  const totalRed = redBills + redBankCredits + redCustomerGave + redManual + redRD;

  const cashAtHome = totalGreen - totalRed;

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="cashbook-container printable-area">
      {/* Top Date Navigator & Controls */}
      <div className="cashbook-header hide-on-print">
        <div className="date-navigator">
          <button className="nav-btn" onClick={handlePrevDay}>
            <ChevronLeft size={20} />
          </button>
          <div className="date-picker-wrapper">
            <Calendar size={18} className="calendar-icon" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="custom-date-picker"
            />
          </div>
          <button className="nav-btn" onClick={handleNextDay}>
            <ChevronRight size={20} />
          </button>
          <button className="today-btn" onClick={handleSetToday}>
            Today
          </button>
        </div>

        <button className="print-btn" onClick={() => window.print()}>
          <Printer size={18} />
          <span>Print Cashbook</span>
        </button>
      </div>

      {/* Print Only Title */}
      <div className="print-only-header">
        <div className="firm-identity">
          <h1>Tanmay Traders</h1>
          <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
          <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
          <p className="contact">Mo. No: 9011874112</p>
        </div>
        <div className="print-report-title">
          <h2>DAILY CASHBOOK REGISTER</h2>
          <div className="print-date">{formatDateReadable(selectedDate)}</div>
        </div>
      </div>

      <div className="readable-date-display hide-on-print">
        <h3>{formatDateReadable(selectedDate)}</h3>
      </div>

      {/* Top Level Summary Widget */}
      <div className="cashbook-summary-widget">
        <div className="summary-card">
          <div className="summary-icon-box orange">
            <Wallet size={28} />
          </div>
          <div className="summary-info">
            <span className="label">Today's Cash at Home (शिल्लक रोकड)</span>
            <span className={`value ${cashAtHome >= 0 ? 'positive' : 'negative'}`}>
              ₹ {cashAtHome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="math-breakdown hide-on-print">
          <div className="breakdown-col">
            <span className="breakdown-lbl">Green Total (जमा)</span>
            <span className="breakdown-val green-text">₹ {totalGreen.toLocaleString('en-IN')}</span>
          </div>
          <div className="math-operator">-</div>
          <div className="breakdown-col">
            <span className="breakdown-lbl">Red Total (नावे)</span>
            <span className="breakdown-val red-text">₹ {totalRed.toLocaleString('en-IN')}</span>
          </div>
          <div className="math-operator">=</div>
          <div className="breakdown-col">
            <span className="breakdown-lbl">Net Cash</span>
            <span className="breakdown-val orange-text">₹ {cashAtHome.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Main Double Column Layout */}
      <div className="cashbook-columns-grid">
        
        {/* GREEN COLUMN (जमा - CREDIT / DEPOSIT) */}
        <div className="cashbook-column green-col">
          <div className="col-header green-header">
            <div className="title-box">
              <TrendingUp size={22} className="col-icon" />
              <h3>जमा (Green Section)</h3>
            </div>
            <div className="total-badge">₹ {totalGreen.toLocaleString('en-IN')}</div>
          </div>

          <div className="col-entries-list">
            
            {/* 1. Cash at Home of last working day */}
            <div className="entry-card static-entry">
              <div className="entry-main">
                <div className="info">
                  <span className="title">मागील शिल्लक रोकड (Opening Cash)</span>
                  <span className="subtitle">Cash at home of last working day</span>
                </div>
                <div className="amount text-green">₹ {opening.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* 2. Today's bank debit amount (only self transactions) */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('bankSelfDebits')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">बँकेतून स्वतः काढलेली रक्कम (Self Withdrawal)</span>
                  <span className="subtitle">Today's bank debit (Self transactions only)</span>
                </div>
                <div className="amount text-green">₹ {greenSelfDebits.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.bankSelfDebits && data.green.bankSelfDebits.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.green.bankSelfDebits.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.description || 'Self withdrawal'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Today's Commission */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('commission')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">आजचे कमिशन उत्पन्न (Today's Commission)</span>
                  <span className="subtitle">Earnings from today's crop bills</span>
                </div>
                <div className="amount text-green">₹ {greenCommission.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.commission && data.green.commission.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.green.commission.list.map((b, idx) => (
                      <div key={b._id || idx} className="detail-item">
                        <span>Merchant: {b.merchantName} ({b.cropName})</span>
                        <strong>₹ {b.commissionAddition.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Today's bank credit amount all */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('bankCredits')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">बँकेत जमा झालेली रक्कम (All Bank Credits)</span>
                  <span className="subtitle">Deposits and merchant bank transfers</span>
                </div>
                <div className="amount text-green">₹ {greenBankCredits.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.bankCredits && data.green.bankCredits.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.green.bankCredits.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.description || 'Deposit'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Customer got entries */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('customerGot')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">शेतकऱ्यांकडून जमा रोकड (Customer Received)</span>
                  <span className="subtitle">Cash got from customer entries</span>
                </div>
                <div className="amount text-green">₹ {greenCustomerGot.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.customerGot && data.green.customerGot.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.green.customerGot.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.customerId?.customerName || 'Customer'} - {tx.description || 'Receipt'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 6. RD Withdrawals (Debits from Buldhana / Aditya) */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('rdWithdrawals')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">आर.डी. नावे / काढलेली रक्कम (RD Withdrawal)</span>
                  <span className="subtitle">Buldhana / Aditya Credit Society debits</span>
                </div>
                <div className="amount text-green">₹ {greenRD.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.rdWithdrawals && data.green.rdWithdrawals?.list?.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.green.rdWithdrawals.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.bankAccountId?.bankName || 'RD Bank'} - {tx.description || 'Withdrawal'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 7. Manual Deposits list */}
            <div className="entry-card static-entry bg-light-green" style={{ cursor: 'default' }}>
              <div className="entry-main-header">
                <span className="sub-header-title">हस्ते जमा नोंदी (Manual Deposits)</span>
                <button className="add-manual-btn text-green hide-on-print" onClick={() => { setModalType('deposit'); setShowModal(true); }}>
                  <Plus size={14} /> Add Manual
                </button>
              </div>
              <div className="amount-list-wrapper">
                {data.green.manualDeposits.list.length === 0 ? (
                  <div className="empty-manual-text">No manual deposits added today.</div>
                ) : (
                  data.green.manualDeposits.list.map(entry => (
                    <div key={entry._id} className="manual-item-row">
                      <div className="manual-desc">
                        <span>{entry.description}</span>
                      </div>
                      <div className="manual-amt-delete">
                        <span>₹ {entry.amount.toLocaleString()}</span>
                        <button className="delete-entry-btn hide-on-print" onClick={() => handleDeleteEntry(entry._id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RED COLUMN (नावे - DEBIT / WITHDRAWAL) */}
        <div className="cashbook-column red-col">
          <div className="col-header red-header">
            <div className="title-box">
              <TrendingDown size={22} className="col-icon" />
              <h3>नावे (Red Section)</h3>
            </div>
            <div className="total-badge">₹ {totalRed.toLocaleString('en-IN')}</div>
          </div>

          <div className="col-entries-list">
            
            {/* 1. Today's bills */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('bills')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">व्यापारी बिले एकूण (Today's Bills)</span>
                  <span className="subtitle">Total of all merchant sale bills generated</span>
                </div>
                <div className="amount text-red">₹ {redBills.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.bills && data.red.bills.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.red.bills.list.map((b, idx) => (
                      <div key={b._id || idx} className="detail-item">
                        <span>Merchant: {b.merchantName} ({b.cropName})</span>
                        <strong>₹ {b.grandTotal.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Today's bank credit offset */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('bankCreditsOffset')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">बँकेत जमा रक्कम (Bank Credits Offset)</span>
                  <span className="subtitle">All deposits offset in Red section</span>
                </div>
                <div className="amount text-red">₹ {redBankCredits.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.bankCreditsOffset && data.red.bankCreditsOffset.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.red.bankCreditsOffset.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.description || 'Deposit'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Customer gave entries */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('customerGave')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">शेतकऱ्यांना दिलेले रोकड (Customer Gave)</span>
                  <span className="subtitle">Payments made to customer entries</span>
                </div>
                <div className="amount text-red">₹ {redCustomerGave.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.customerGave && data.red.customerGave.list.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.red.customerGave.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.customerId?.customerName || 'Customer'} - {tx.description || 'Debit Loan'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. RD Deposits (Credits to Buldhana / Aditya) */}
            <div className="entry-card expandable-entry" onClick={() => toggleExpand('rdDeposits')}>
              <div className="entry-main">
                <div className="info">
                  <span className="title">आर.डी. जमा / ठेवलेली रक्कम (RD Deposit)</span>
                  <span className="subtitle">Buldhana / Aditya Credit Society credits</span>
                </div>
                <div className="amount text-red">₹ {redRD.toLocaleString('en-IN')}</div>
              </div>
              <AnimatePresence>
                {expandedSection.rdDeposits && data.red.rdDeposits?.list?.length > 0 && (
                  <motion.div 
                    className="expanded-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {data.red.rdDeposits.list.map((tx, idx) => (
                      <div key={tx._id || idx} className="detail-item">
                        <span>{tx.bankAccountId?.bankName || 'RD Bank'} - {tx.description || 'Deposit'}</span>
                        <strong>₹ {tx.amount.toLocaleString()}</strong>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Manual Withdrawals list */}
            <div className="entry-card static-entry bg-light-red" style={{ cursor: 'default' }}>
              <div className="entry-main-header">
                <span className="sub-header-title">हस्ते नावे नोंदी (Manual Withdrawals)</span>
                <button className="add-manual-btn text-red hide-on-print" onClick={() => { setModalType('withdrawal'); setShowModal(true); }}>
                  <Plus size={14} /> Add Manual
                </button>
              </div>
              <div className="amount-list-wrapper">
                {data.red.manualWithdrawals.list.length === 0 ? (
                  <div className="empty-manual-text">No manual withdrawals added today.</div>
                ) : (
                  data.red.manualWithdrawals.list.map(entry => (
                    <div key={entry._id} className="manual-item-row">
                      <div className="manual-desc">
                        <span>{entry.description}</span>
                      </div>
                      <div className="manual-amt-delete">
                        <span>₹ {entry.amount.toLocaleString()}</span>
                        <button className="delete-entry-btn hide-on-print" onClick={() => handleDeleteEntry(entry._id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Manual Entry Dialog Modal */}
      {showModal && (
        <div className="modal-overlay hide-on-print">
          <div className="modal-content glass-panel animated-modal">
            <h3>Add Manual {modalType === 'deposit' ? 'जमा (Deposit)' : 'नावे (Withdrawal)'} Entry</h3>
            <form onSubmit={handleAddEntry}>
              <div className="form-group">
                <label>Description / Remarks *</label>
                <input 
                  type="text" 
                  value={entryDesc} 
                  onChange={(e) => setEntryDesc(e.target.value)} 
                  placeholder="e.g. Paid tea bill, received interest" 
                  required 
                  autoFocus
                  className="form-input-box"
                />
              </div>

              <div className="form-group">
                <label>Amount (₹) *</label>
                <input 
                  type="number" 
                  value={entryAmount} 
                  onChange={(e) => setEntryAmount(e.target.value)} 
                  placeholder="0.00" 
                  required 
                  className="form-input-box"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
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

export default Cashbook;
