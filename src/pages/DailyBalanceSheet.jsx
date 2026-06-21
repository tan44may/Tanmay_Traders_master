import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Building, 
  FileText, 
  Receipt, 
  Users
} from 'lucide-react';
import './DailyBalanceSheet.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

// Dynamic mock data generator to give a rich experience when backend is not running
const getMockDataForDate = (dateStr) => {
  const seed = dateStr.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Seed-based random values to keep same data for same date
  const random = (s) => {
    const x = Math.sin(seed + s) * 10000;
    return x - Math.floor(x);
  };

  const names = ['Ramesh Patel', 'Suresh Kumar', 'Ganesh Shinde', 'Vijay Sharma', 'Anil Deshmukh', 'Rajesh Joshi', 'Nitin Patil'];
  const merchants = ['Vitthal Grain Traders', 'Karanja Agro Industry', 'Washim Cotton Co.', 'Maroti Oil Mills', 'Balaji Trading House'];
  const crops = ['Soybean', 'Cotton', 'Tur', 'Gram', 'Wheat'];

  const pattis = [];
  const bills = [];
  const customerTransactions = [];
  const merchantTransactions = [];
  const bankTransactions = [];

  // Generate 2-4 aligned transactions
  const numTransactions = Math.floor(random(1) * 3) + 2;
  for (let i = 0; i < numTransactions; i++) {
    const qty = Math.floor(random(2 + i) * 80) + 10;
    const rate = Math.floor(random(3 + i) * 200) + 3800;
    const total = qty * rate;
    const hamali = qty * 15;
    const tolai = qty * 10;
    const other = Math.floor(random(4 + i) * 200) + 50;
    const pattiGrand = total - (hamali + tolai + other);

    const customer = names[Math.floor(random(5 + i) * names.length)];
    const merchant = merchants[Math.floor(random(6 + i) * merchants.length)];
    const crop = crops[Math.floor(random(7 + i) * crops.length)];

    pattis.push({
      _id: `patti_${i}_${dateStr}`,
      date: dateStr,
      createdAt: `${dateStr}T10:${15 + i * 20}:00.000Z`,
      customerName: customer,
      merchantName: merchant,
      cropName: crop,
      quantity: qty,
      rate: rate,
      totalAmount: total,
      hamaliDeduction: hamali,
      tolaiDeduction: tolai,
      otherCharges: other,
      grandTotal: pattiGrand
    });

    // Create a matching bill
    const commission = Math.round((total * 1) / 100);
    const billGrand = total - tolai + commission;

    bills.push({
      _id: `bill_${i}_${dateStr}`,
      date: dateStr,
      createdAt: `${dateStr}T11:${10 + i * 30}:00.000Z`,
      merchantName: merchant,
      cropName: crop,
      quantity: qty,
      rate: rate,
      totalAmount: total,
      tolaiDeduction: tolai,
      commissionAddition: commission,
      grandTotal: billGrand
    });
  }

  // Generate 2-4 Customer Transactions
  const numCustTx = Math.floor(random(13) * 3) + 2;
  for (let i = 0; i < numCustTx; i++) {
    const type = random(14 + i) > 0.45 ? 'gave' : 'got';
    const amount = Math.floor(random(15 + i) * 8) * 5000 + 5000;
    customerTransactions.push({
      _id: `custtx_${i}_${dateStr}`,
      date: `${dateStr}T13:${10 + i * 15}:00.000Z`,
      type,
      amount,
      interestRate: type === 'gave' ? 2 : 0,
      description: type === 'gave' ? 'Crop advancement loan' : 'Settlement of account',
      customerId: {
        customerName: names[Math.floor(random(16 + i) * names.length)]
      }
    });
  }

  // Generate 1-3 Merchant Transactions
  const numMerchTx = Math.floor(random(17) * 3) + 1;
  for (let i = 0; i < numMerchTx; i++) {
    const type = random(18 + i) > 0.5 ? 'gave' : 'got';
    const amount = Math.floor(random(19 + i) * 12) * 10000 + 10000;
    merchantTransactions.push({
      _id: `merchtx_${i}_${dateStr}`,
      date: `${dateStr}T14:${12 + i * 20}:00.000Z`,
      type,
      amount,
      cropName: crops[Math.floor(random(20 + i) * crops.length)],
      description: type === 'gave' ? 'Advance paid for soybean' : 'Received check clearing',
      merchantId: {
        merchantName: merchants[Math.floor(random(21 + i) * merchants.length)]
      }
    });
  }

  // Generate 1-2 Bank Transactions
  const numBankTx = Math.floor(random(22) * 2) + 1;
  const banks = ['State Bank of India', 'HDFC Bank', 'Bank of Maharashtra'];
  for (let i = 0; i < numBankTx; i++) {
    const type = random(23 + i) > 0.5 ? 'credit' : 'debit';
    const amount = Math.floor(random(24 + i) * 10) * 15000 + 10000;
    bankTransactions.push({
      _id: `banktx_${i}_${dateStr}`,
      date: `${dateStr}T15:${25 + i * 15}:00.000Z`,
      type,
      amount,
      description: type === 'credit' ? 'Cash deposit' : 'Online RTGS vendor payment',
      bankAccountId: {
        bankName: banks[Math.floor(random(25 + i) * banks.length)],
        accountNumber: `XXXXXX${3824 + i * 14}`
      }
    });
  }

  return {
    pattis,
    bills,
    customerTransactions,
    merchantTransactions,
    bankTransactions
  };
};

const DailyBalanceSheet = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({
    pattis: [],
    bills: [],
    customerTransactions: [],
    merchantTransactions: [],
    bankTransactions: []
  });
  const [loading, setLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Fetch report data on date change
  useEffect(() => {
    const fetchDailyData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/daily-balance?date=${selectedDate}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
          setIsUsingMockData(false);
        } else {
          // Fallback to local mock data generator
          const mockData = getMockDataForDate(selectedDate);
          setData(mockData);
          setIsUsingMockData(true);
        }
      } catch (error) {
        console.warn("Backend API not available. Showing simulated data.");
        // Fallback to local mock data generator
        const mockData = getMockDataForDate(selectedDate);
        setData(mockData);
        setIsUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [selectedDate]);

  // Navigate dates
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

  // Helper date formatter
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

  // Total Calculations (for cards)
  const totalPattiAmt = data.pattis.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const totalBillAmt = data.bills.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  
  const totalCustGave = data.customerTransactions.reduce((sum, r) => sum + (r.type === 'gave' ? r.amount : 0), 0);
  const totalCustGot = data.customerTransactions.reduce((sum, r) => sum + (r.type === 'got' ? r.amount : 0), 0);
  
  const totalMerchGave = data.merchantTransactions.reduce((sum, r) => sum + (r.type === 'gave' ? r.amount : 0), 0);
  const totalMerchGot = data.merchantTransactions.reduce((sum, r) => sum + (r.type === 'got' ? r.amount : 0), 0);

  // Aligned rows matching logic
  const getAlignedRows = () => {
    const rows = [];
    const matchedBillIds = new Set();

    (data.pattis || []).forEach(patti => {
      const matchingBill = (data.bills || []).find(bill => 
        !matchedBillIds.has(bill._id || bill.id) &&
        bill.merchantName === patti.merchantName &&
        bill.cropName === patti.cropName &&
        bill.quantity === patti.quantity &&
        bill.rate === patti.rate
      );

      if (matchingBill) {
        matchedBillIds.add(matchingBill._id || matchingBill.id);
        rows.push({ patti, bill: matchingBill });
      } else {
        rows.push({ patti, bill: null });
      }
    });

    (data.bills || []).forEach(bill => {
      if (!matchedBillIds.has(bill._id || bill.id)) {
        rows.push({ patti: null, bill });
      }
    });

    return rows;
  };

  const alignedRows = getAlignedRows();

  // Column totals
  const totalPattiCol = alignedRows.reduce((sum, row) => sum + (row.patti ? (row.patti.grandTotal || 0) : 0), 0);
  const totalBillCol = alignedRows.reduce((sum, row) => sum + (row.bill ? (row.bill.grandTotal || 0) : 0), 0);
  const totalCommission = alignedRows.reduce((sum, row) => sum + (row.bill ? (row.bill.commissionAddition || 0) : 0), 0);
  const totalHamaliCharges = alignedRows.reduce((sum, row) => sum + (row.patti ? ((row.patti.hamaliDeduction || 0) + (row.patti.otherCharges || 0)) : 0), 0);

  // Match LHS and RHS (using threshold to avoid JavaScript floating point errors)
  const LHS = totalPattiCol + totalCommission + totalHamaliCharges;
  const RHS = totalBillCol;
  const isMatched = Math.abs(LHS - RHS) < 0.01;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="balance-sheet-container printable-area">
      {/* Date Navigation & Actions Header */}
      <div className="sheet-header-controls hide-on-print">
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

        <div className="actions-wrapper">
          {isUsingMockData && (
            <span className="mock-badge" title="Dynamic simulation data based on date selection">
              Simulated Data
            </span>
          )}
          <button className="print-btn" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Header */}
      <div className="print-only-header">
        <div className="firm-identity">
          <h1>Tanmay Traders</h1>
          <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
          <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
          <p className="contact">Mo. No: 9011874112</p>
        </div>
        <div className="print-report-title">
          <h2>DAILY BALANCE SHEET</h2>
          <div className="print-date">{formatDateReadable(selectedDate)}</div>
        </div>
      </div>

      <div className="readable-date-display hide-on-print">
        <h3>{formatDateReadable(selectedDate)}</h3>
      </div>

      {loading ? (
        <div className="sheet-loading">
          <div className="spinner"></div>
          <p>Analyzing transactions for the day...</p>
        </div>
      ) : (
        <div className="sheet-content">
          {/* Main Dashboard Metrics */}
          <div className="metrics-grid">
            {/* Patti Sales Card */}
            <motion.div 
              className="metric-card patti"
              whileHover={{ y: -4 }}
            >
              <div className="card-header">
                <span className="icon-wrapper"><FileText size={20} /></span>
                <span className="card-label">Patti Sales</span>
              </div>
              <div className="card-value">₹ {totalPattiAmt.toLocaleString()}</div>
              <div className="card-sub">{data.pattis.length} Records Created</div>
            </motion.div>

            {/* Bill Purchases Card */}
            <motion.div 
              className="metric-card bill"
              whileHover={{ y: -4 }}
            >
              <div className="card-header">
                <span className="icon-wrapper"><Receipt size={20} /></span>
                <span className="card-label">Bill Purchases</span>
              </div>
              <div className="card-value">₹ {totalBillAmt.toLocaleString()}</div>
              <div className="card-sub">{data.bills.length} Invoices Registered</div>
            </motion.div>

            {/* Customers Transactions Card */}
            <motion.div 
              className="metric-card customer"
              whileHover={{ y: -4 }}
            >
              <div className="card-header">
                <span className="icon-wrapper"><Users size={20} /></span>
                <span className="card-label">Customer Cashbook</span>
              </div>
              <div className="card-split-values">
                <div className="split-val gave">
                  <span className="label">Gave (Dr):</span>
                  <span>₹ {totalCustGave.toLocaleString()}</span>
                </div>
                <div className="split-val got">
                  <span className="label">Got (Cr):</span>
                  <span>₹ {totalCustGot.toLocaleString()}</span>
                </div>
              </div>
              <div className="card-sub">{data.customerTransactions.length} Entries Added</div>
            </motion.div>

            {/* Merchant Transactions Card */}
            <motion.div 
              className="metric-card merchant"
              whileHover={{ y: -4 }}
            >
              <div className="card-header">
                <span className="icon-wrapper"><Building size={20} /></span>
                <span className="card-label">Merchant Cashbook</span>
              </div>
              <div className="card-split-values">
                <div className="split-val gave">
                  <span className="label">Paid (Dr):</span>
                  <span>₹ {totalMerchGave.toLocaleString()}</span>
                </div>
                <div className="split-val got">
                  <span className="label">Recd (Cr):</span>
                  <span>₹ {totalMerchGot.toLocaleString()}</span>
                </div>
              </div>
              <div className="card-sub">{data.merchantTransactions.length} Entries Added</div>
            </motion.div>
          </div>

          {/* Daily Balance Alignment Table */}
          <div className="balance-table-section">
            <h3 className="section-title">Daily Balance Matching Sheet</h3>
            <div className="table-responsive">
              <table className="balance-matching-table">
                <thead>
                  <tr>
                    <th>Patti (Customer)</th>
                    <th>Bill (Merchant)</th>
                    <th>Commission (Cr)</th>
                    <th>Hamali + Charges (Dr)</th>
                  </tr>
                </thead>
                <tbody>
                  {alignedRows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row-text">No transactions recorded for this date.</td>
                    </tr>
                  ) : (
                    alignedRows.map((row, idx) => {
                      const pattiAmt = row.patti ? row.patti.grandTotal : 0;
                      const billAmt = row.bill ? row.bill.grandTotal : 0;
                      const commissionAmt = row.bill ? row.bill.commissionAddition : 0;
                      const hamaliChargesAmt = row.patti ? (row.patti.hamaliDeduction + row.patti.otherCharges) : 0;

                      return (
                        <tr key={idx}>
                          <td>
                            {row.patti ? (
                              <div className="table-cell-content">
                                <span className="entity-name">{row.patti.customerName}</span>
                                <span className="entity-amount">₹ {pattiAmt.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="no-value">-</span>
                            )}
                          </td>
                          <td>
                            {row.bill ? (
                              <div className="table-cell-content">
                                <span className="entity-name">{row.bill.merchantName}</span>
                                <span className="entity-amount">₹ {billAmt.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="no-value">-</span>
                            )}
                          </td>
                          <td className="amount-col commission-addition">
                            {row.bill ? `₹ ${commissionAmt.toLocaleString()}` : <span className="no-value">-</span>}
                          </td>
                          <td className="amount-col">
                            {row.patti ? `₹ ${hamaliChargesAmt.toLocaleString()}` : <span className="no-value">-</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className={`totals-row ${isMatched ? 'matched-highlight' : 'unmatched-highlight'}`}>
                    <td>
                      <div className="total-label-val">
                        <span>Total Patti:</span>
                        <strong>₹ {totalPattiCol.toLocaleString()}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="total-label-val">
                        <span>Total Bill:</span>
                        <strong>₹ {totalBillCol.toLocaleString()}</strong>
                      </div>
                    </td>
                    <td className="amount-col font-bold commission-addition">
                      ₹ {totalCommission.toLocaleString()}
                    </td>
                    <td className="amount-col font-bold">
                      ₹ {totalHamaliCharges.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* LHS = RHS Balance Comparison Block */}
          <div className="balance-matching-banner-section">
            <div className="comparison-flex">
              <div className="comparison-card lhs">
                <span className="label">LHS (Patti + Commission + Hamali)</span>
                <span className="value">
                  ₹ {totalPattiCol.toLocaleString()} + <span className="text-green-addition">₹ {totalCommission.toLocaleString()}</span> + ₹ {totalHamaliCharges.toLocaleString()}
                  <div className="sub-calc">
                    = <strong>₹ {LHS.toLocaleString()}</strong>
                  </div>
                </span>
              </div>
              
              <div className="comparison-vs">
                <span>=</span>
              </div>

              <div className="comparison-card rhs">
                <span className="label">RHS (Bill)</span>
                <span className="value">
                  ₹ {totalBillCol.toLocaleString()}
                  <div className="sub-calc">
                    = <strong>₹ {RHS.toLocaleString()}</strong>
                  </div>
                </span>
              </div>
            </div>

            {/* Popping animated centered matched / unmatched status indicator */}
            <motion.div 
              className={`match-status-center-card ${isMatched ? 'matched' : 'unmatched'}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              key={`${isMatched}-${selectedDate}`}
            >
              <div className="status-circle-wrapper">
                {isMatched ? (
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
                <h4 className="status-title">{isMatched ? 'Balancesheet Matched' : 'Balancesheet Unmatched'}</h4>
                <p className="status-desc">
                  {isMatched 
                    ? 'All transactions are completely balanced for this date.' 
                    : `Difference of ₹ ${Math.abs(LHS - RHS).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} detected between LHS and RHS.`
                  }
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyBalanceSheet;
