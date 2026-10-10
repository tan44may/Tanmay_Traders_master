import React, { useState, useEffect, useRef } from 'react';
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
  TrendingDown,
  Calculator,
  Coins,
  Banknote,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import './Cashbook.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

// Denominations from 1 to 500
const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const DENOM_CONFIG = {
  500: { label: '₹ 500', type: 'Note', color: '#334155', bg: '#f1f5f9', border: '#cbd5e1' },
  200: { label: '₹ 200', type: 'Note', color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
  100: { label: '₹ 100', type: 'Note', color: '#7e22ce', bg: '#f3e8ff', border: '#e9d5ff' },
  50:  { label: '₹ 50',  type: 'Note', color: '#0f766e', bg: '#ccfbf1', border: '#99f6e4' },
  20:  { label: '₹ 20',  type: 'Note', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  10:  { label: '₹ 10',  type: 'Note / Coin', color: '#9a3412', bg: '#ffedd5', border: '#fdba74' },
  5:   { label: '₹ 5',   type: 'Note / Coin', color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  2:   { label: '₹ 2',   type: 'Coin / Note', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  1:   { label: '₹ 1',   type: 'Coin / Note', color: '#854d0e', bg: '#fef9c3', border: '#fef08a' }
};

const emptyDenominations = {
  '500': '',
  '200': '',
  '100': '',
  '50': '',
  '20': '',
  '10': '',
  '5': '',
  '2': '',
  '1': ''
};

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

  // Note calculator state
  const [denominationCounts, setDenominationCounts] = useState(emptyDenominations);
  const [denominationRemarks, setDenominationRemarks] = useState('');
  const [isSavingDenomination, setIsSavingDenomination] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const calculatorRef = useRef(null);

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

        // Load saved denomination for this date if present
        if (result.data.denomination && result.data.denomination.counts) {
          const loaded = {};
          DENOMINATIONS.forEach(d => {
            const val = result.data.denomination.counts[d];
            loaded[d] = (val !== undefined && val !== null && val > 0) ? String(val) : '';
          });
          setDenominationCounts(loaded);
          setDenominationRemarks(result.data.denomination.remarks || '');
          setSavedAt(result.data.denomination.updatedAt || result.data.denomination.createdAt || new Date().toISOString());
        } else {
          // Check local storage fallback
          const localSaved = localStorage.getItem(`tanmay_denom_${selectedDate}`);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              setDenominationCounts(parsed.counts || { ...emptyDenominations });
              setDenominationRemarks(parsed.remarks || '');
              setSavedAt(parsed.savedAt || null);
            } catch (err) {
              setDenominationCounts({ ...emptyDenominations });
              setDenominationRemarks('');
              setSavedAt(null);
            }
          } else {
            setDenominationCounts({ ...emptyDenominations });
            setDenominationRemarks('');
            setSavedAt(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cashbook:', error);
      // Fallback check local storage
      const localSaved = localStorage.getItem(`tanmay_denom_${selectedDate}`);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setDenominationCounts(parsed.counts || { ...emptyDenominations });
          setDenominationRemarks(parsed.remarks || '');
          setSavedAt(parsed.savedAt || null);
        } catch (err) {
          setDenominationCounts({ ...emptyDenominations });
          setSavedAt(null);
        }
      } else {
        setDenominationCounts({ ...emptyDenominations });
        setSavedAt(null);
      }
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

  // Note calculator automatic calculations
  const totalNotes = DENOMINATIONS.reduce((sum, d) => {
    return sum + (parseInt(denominationCounts[d], 10) || 0);
  }, 0);

  const calculatorTotal = DENOMINATIONS.reduce((sum, d) => {
    const count = parseInt(denominationCounts[d], 10) || 0;
    return sum + (d * count);
  }, 0);

  // Match only integer rupee amount (ignoring paise/decimal points)
  const integerCashbook = Math.trunc(cashAtHome);
  const integerCalculator = Math.trunc(calculatorTotal);
  const cashDifference = integerCalculator - integerCashbook;
  const isCashMatched = integerCalculator === integerCashbook;

  // Handlers for note calculator
  const handleCountChange = (denom, val) => {
    if (val === '' || /^\d+$/.test(val)) {
      setDenominationCounts(prev => ({
        ...prev,
        [denom]: val
      }));
      setSaveSuccessMsg('');
    }
  };

  const handleClearCounts = () => {
    if (window.confirm('तुम्हाला नोटांची मोजणी रीसेट करायची आहे का? (Do you want to reset note counts?)')) {
      setDenominationCounts({ ...emptyDenominations });
      setSaveSuccessMsg('');
    }
  };

  const handleSaveDenomination = async () => {
    setIsSavingDenomination(true);
    setSaveSuccessMsg('');
    const countsPayload = {};
    DENOMINATIONS.forEach(d => {
      countsPayload[d] = parseInt(denominationCounts[d], 10) || 0;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/cashbook/denomination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          counts: countsPayload,
          totalNotes,
          totalAmount: calculatorTotal,
          cashbookBalance: cashAtHome,
          isMatched: isCashMatched,
          remarks: denominationRemarks
        })
      });
      const result = await response.json();
      if (result.success) {
        const now = new Date().toISOString();
        setSavedAt(now);
        setSaveSuccessMsg('चलन मोजणी यशस्वीरीत्या जतन झाली! (Saved successfully)');
        localStorage.setItem(`tanmay_denom_${selectedDate}`, JSON.stringify({
          counts: denominationCounts,
          remarks: denominationRemarks,
          savedAt: now
        }));
        setTimeout(() => setSaveSuccessMsg(''), 4500);
      } else {
        alert(result.message || 'Failed to save denomination');
      }
    } catch (err) {
      console.warn('Backend save error, fallback to local storage:', err);
      const now = new Date().toISOString();
      setSavedAt(now);
      localStorage.setItem(`tanmay_denom_${selectedDate}`, JSON.stringify({
        counts: denominationCounts,
        remarks: denominationRemarks,
        savedAt: now
      }));
      setSaveSuccessMsg('स्थानिकरीत्या जतन केले (Saved locally)');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } finally {
      setIsSavingDenomination(false);
    }
  };

  const scrollToCalculator = () => {
    if (calculatorRef.current) {
      calculatorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatSavedTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdaysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayTranslations = {
      'Sunday': 'रविवार',
      'Monday': 'सोमवार',
      'Tuesday': 'मंगळवार',
      'Wednesday': 'बुधवार',
      'Thursday': 'गुरुवार',
      'Friday': 'शुक्रवार',
      'Saturday': 'शनिवार'
    };
    const dayName = weekdayTranslations[weekdaysEng[date.getDay()]] || weekdaysEng[date.getDay()];
    const dateFormatted = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return `${dayName}, ${dateFormatted}`;
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
            <button 
              className="summary-match-pill-btn hide-on-print" 
              onClick={scrollToCalculator}
              title="चलन मोजणी पहा (Click to inspect Note Calculator)"
            >
              {isCashMatched ? (
                <span className="summary-pill pill-matched">
                  <CheckCircle2 size={15} /> रोकड जुळली (Cash Matched)
                </span>
              ) : (
                <span className="summary-pill pill-unmatched">
                  <XCircle size={15} /> फरक: ₹ {Math.abs(cashDifference).toLocaleString('en-IN')}
                </span>
              )}
            </button>
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

      {/* 4. Note Denomination Calculator Section */}
      <div className="note-calculator-section hide-on-print" ref={calculatorRef} id="note-calculator">
        {/* Section Header */}
        <div className="note-calc-header">
          <div className="note-calc-title-box">
            <div className="note-calc-icon-wrapper">
              <Calculator size={26} />
            </div>
            <div>
              <h3>दैनिक नोटा मोजणी (Daily Note Calculator)</h3>
              <p className="subtitle">
                १ ते ५०० रुपयांच्या सर्व नोटा/नाणी मोजून कॅशबुक शिल्लक रोकड तपासा (Denominations from ₹1 to ₹500)
              </p>
            </div>
          </div>

          <div className="note-calc-header-actions">
            {savedAt && (
              <span className="save-status-info">
                <Check size={15} color="#10b981" /> जतन: {formatSavedTime(savedAt)}
              </span>
            )}
            <button className="btn-secondary-calc" onClick={handleClearCounts} title="रीसेट करा (Clear All)">
              <RotateCcw size={15} />
              <span>रीसेट (Clear)</span>
            </button>
            <button 
              className="btn-primary-calc" 
              onClick={handleSaveDenomination} 
              disabled={isSavingDenomination}
            >
              <Save size={16} />
              <span>{isSavingDenomination ? 'जतन होत आहे...' : 'जतन करा (Save Daily)'}</span>
            </button>
          </div>
        </div>

        {/* 9 Denomination Cards (₹500 to ₹1) */}
        <div className="denom-grid">
          {DENOMINATIONS.map(d => {
            const config = DENOM_CONFIG[d];
            const count = parseInt(denominationCounts[d], 10) || 0;
            const subtotal = d * count;
            const hasValue = count > 0;

            return (
              <div 
                key={d} 
                className={`denom-card ${hasValue ? 'has-value' : ''}`}
                style={hasValue ? { borderColor: config.border } : {}}
              >
                <div className="denom-badge-group">
                  <span 
                    className="denom-pill"
                    style={{ 
                      backgroundColor: config.bg, 
                      color: config.color,
                      border: `1px solid ${config.border}`
                    }}
                  >
                    {config.label}
                  </span>
                  <span className="denom-type-tag">{config.type}</span>
                </div>

                <span className="denom-multiply-symbol">×</span>

                <div className="denom-input-wrapper">
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={denominationCounts[d]}
                    onChange={(e) => handleCountChange(d, e.target.value)}
                    placeholder="0"
                    className="denom-input"
                    aria-label={`Count for ${config.label}`}
                  />
                </div>

                <span className="denom-equals-symbol">=</span>

                <div className={`denom-subtotal ${hasValue ? 'highlighted' : ''}`}>
                  ₹ {subtotal.toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview Bar */}
        <div className="note-calc-metrics-bar">
          <div className="metric-chunk">
            <span className="chunk-label">एकूण नोटा संख्या (Total Count)</span>
            <span className="chunk-val">{totalNotes} नोटा</span>
          </div>

          <div className="metric-chunk">
            <span className="chunk-label">कॅल्क्युलेटर मोजलेली रोकड (Physical Cash)</span>
            <span className="chunk-val accent-green">
              ₹ {calculatorTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="metric-chunk">
            <span className="chunk-label">कॅशबुक प्रमाणे रोकड (Cashbook Balance)</span>
            <span className="chunk-val accent-orange">
              ₹ {cashAtHome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Balance Matching Block with Centered SVG Animated Tick / Cross */}
        <div className="balance-matching-banner-section">
          <div className="comparison-flex">
            <div className="comparison-card lhs">
              <span className="label">कॅशबुक शिल्लक (Cashbook Net Balance)</span>
              <span className="value">
                जमा (Green) - नावे (Red)
                <div className="sub-calc">
                  = <strong>₹ {cashAtHome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  {cashAtHome % 1 !== 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                      (रुपये: ₹ {integerCashbook.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
              </span>
            </div>

            <div className="comparison-vs">
              <span>{isCashMatched ? '=' : '≠'}</span>
            </div>

            <div className="comparison-card rhs">
              <span className="label">कॅल्क्युलेटर रोकड (Calculated Cash Count)</span>
              <span className="value">
                {totalNotes} नोटा/नाणी मोजणी
                <div className="sub-calc">
                  = <strong>₹ {calculatorTotal.toLocaleString('en-IN')}</strong>
                </div>
              </span>
            </div>
          </div>

          {/* Popping animated centered matched / unmatched status indicator */}
          <motion.div 
            className={`match-status-center-card ${isCashMatched ? 'matched' : 'unmatched'}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            key={`${isCashMatched}-${calculatorTotal}-${cashAtHome}`}
          >
            <div className="status-circle-wrapper">
              {isCashMatched ? (
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              ) : (
                <svg className="crossmark-svg" viewBox="0 0 52 52">
                  <circle className="crossmark-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="crossmark-line1" fill="none" d="M16 16 L36 36" />
                  <path className="crossmark-line2" fill="none" d="M36 16 L16 36" />
                </svg>
              )}
            </div>
            <div className="status-info-centered">
              <h4 className="status-title">
                {isCashMatched ? 'रोकड तंतोतंत जुळली (Cash Matched)' : 'रोकड जुळत नाही (Cash Unmatched)'}
              </h4>
              <p className="status-desc">
                {isCashMatched 
                  ? `कॅशबुक शिल्लक (₹ ${integerCashbook.toLocaleString('en-IN')}) आणि मोजलेली प्रत्यक्ष रोकड (₹ ${integerCalculator.toLocaleString('en-IN')}) जुळली आहे. (पैसे सोडून मोजणी बरोबर जुळली)` 
                  : (cashDifference > 0 
                     ? `जादा रोकड (Excess Cash): मोजलेली प्रत्यक्ष रोकड कॅशबुकपेक्षा ₹ ${Math.abs(cashDifference).toLocaleString('en-IN')} ने जास्त आहे.`
                     : `कमी रोकड (Shortage / Deficit): मोजलेली प्रत्यक्ष रोकड कॅशबुकपेक्षा ₹ ${Math.abs(cashDifference).toLocaleString('en-IN')} ने कमी आहे.`
                    )
                }
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer: Remarks & Save button */}
        <div className="note-calc-footer">
          <div className="remarks-input-wrapper">
            <input 
              type="text" 
              placeholder="नोंद किंवा शेरा टाका (उदा. तन्मय द्वारे रोकड पडताळणी पूर्ण)..."
              value={denominationRemarks}
              onChange={(e) => setDenominationRemarks(e.target.value)}
              className="remarks-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {saveSuccessMsg && (
              <span className="save-success-badge">
                <Check size={14} /> {saveSuccessMsg}
              </span>
            )}
            <button 
              className="btn-primary-calc" 
              onClick={handleSaveDenomination} 
              disabled={isSavingDenomination}
            >
              <Save size={16} />
              <span>{isSavingDenomination ? 'जतन करत आहे...' : 'जतन करा (Save Denomination)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Cash Denomination Slip (Appears when printing Daily Cashbook) */}
      <div className="print-denomination-slip">
        <div className="print-denom-title">दैनिक रोकड चलन मोजणी तक्ता (PHYSICAL CASH DENOMINATION STATEMENT)</div>
        <table className="print-denom-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>चलन (Denomination)</th>
              <th style={{ width: '25%', textAlign: 'center' }}>नोटांची संख्या (Count)</th>
              <th style={{ width: '25%', textAlign: 'right' }}>एकूण रक्कम (Amount ₹)</th>
              <th style={{ width: '25%' }}>शेरा (Remarks)</th>
            </tr>
          </thead>
          <tbody>
            {DENOMINATIONS.map(d => {
              const count = parseInt(denominationCounts[d], 10) || 0;
              const amt = d * count;
              return (
                <tr key={d}>
                  <td><strong>₹ {d}</strong> ({DENOM_CONFIG[d].type})</td>
                  <td style={{ textAlign: 'center' }}>{count > 0 ? count : '-'}</td>
                  <td style={{ textAlign: 'right' }}>{count > 0 ? `₹ ${amt.toLocaleString('en-IN')}` : '-'}</td>
                  <td>{d === 500 && denominationRemarks ? denominationRemarks : ''}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="print-denom-footer-row">
              <td>एकूण नोटा (Total Notes):</td>
              <td style={{ textAlign: 'center' }}><strong>{totalNotes}</strong></td>
              <td style={{ textAlign: 'right' }}><strong>₹ {calculatorTotal.toLocaleString('en-IN')}</strong></td>
              <td>{isCashMatched ? '✅ रोकड जुळली (MATCHED)' : '❌ फरक (UNMATCHED)'}</td>
            </tr>
          </tfoot>
        </table>

        <div className="print-reconciliation-box">
          <div>
            <strong>कॅशबुक शिल्लक (Cashbook Balance):</strong> ₹ {cashAtHome.toLocaleString('en-IN')} &nbsp;|&nbsp; 
            <strong> प्रत्यक्ष मोजलेली रोकड (Physical Cash):</strong> ₹ {calculatorTotal.toLocaleString('en-IN')} &nbsp;|&nbsp; 
            <strong> फरक (Diff):</strong> ₹ {Math.abs(cashDifference).toLocaleString('en-IN')}
          </div>
          <div className="print-stamp-box">
            {isCashMatched ? 'VERIFIED & BALANCED ✓' : 'DIFFERENCE DETECTED ⚠'}
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
