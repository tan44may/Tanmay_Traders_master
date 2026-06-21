import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Layers,
  Printer 
} from 'lucide-react';
import './Commissions.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Commissions = () => {
  const [bills, setBills] = useState([]);
  const [overallCommission, setOverallCommission] = useState(0);
  const [currentMonthCommission, setCurrentMonthCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});
  const [isPrintingOverall, setIsPrintingOverall] = useState(false);
  const [printingMonth, setPrintingMonth] = useState(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingOverall(false);
      setPrintingMonth(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrintOverall = () => {
    setIsPrintingOverall(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintMonth = (monthKey) => {
    setPrintingMonth(monthKey);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/reports/commissions`);
        const data = await response.json();
        if (data.success) {
          setBills(data.data.bills || []);
          setOverallCommission(data.data.overallCommission || 0);
          setCurrentMonthCommission(data.data.currentMonthCommission || 0);
        }
      } catch (error) {
        console.error('Error fetching commission report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommissions();
  }, []);

  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  // Helper to format date display (YYYY-MM-DD -> DD-MM-YYYY)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to format month name (e.g. "2026-06" -> "June 2026")
  const formatMonthHeader = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // 1. Group bills by Month (e.g. "2026-06")
  const groupedByMonth = bills.reduce((acc, bill) => {
    if (!bill.date) return acc;
    const monthKey = bill.date.substring(0, 7); // "YYYY-MM"
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(bill);
    return acc;
  }, {});

  // Sort months in descending order
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div className={`commissions-container printable-area ${printingMonth ? 'print-single-month' : ''}`}>
      {/* Print Header for Overall */}
      {isPrintingOverall && (
        <div className="print-only-header">
          <div className="firm-identity">
            <h1>Tanmay Traders</h1>
            <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
            <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
            <p className="contact">Mo. No: 9011874112</p>
          </div>
          <div className="print-report-title">
            <h2>Overall Commission Agent Ledger</h2>
            <p className="print-date">All-Time Aggregated Commission Report</p>
            <p className="print-date" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Printed on: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      )}

      {/* Print Header for Single Month */}
      {printingMonth && (
        <div className="print-only-header">
          <div className="firm-identity">
            <h1>Tanmay Traders</h1>
            <p className="subtitle">Soybean, Cotton, Tur, & All grains commission agent</p>
            <p className="location">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
            <p className="contact">Mo. No: 9011874112</p>
          </div>
          <div className="print-report-title">
            <h2>Monthly Commission Report</h2>
            <p className="print-date">Month: <strong>{formatMonthHeader(printingMonth)}</strong></p>
            <p className="print-date" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Printed on: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="commissions-header hide-on-print">
        <div className="header-title">
          <Briefcase size={28} className="header-icon" />
          <div>
            <h2>Commission Agent Ledger</h2>
            <p>Track daily, monthly, and overall grain broker commissions</p>
          </div>
        </div>
        <button className="print-overall-btn" onClick={handlePrintOverall}>
          <Printer size={18} />
          <span>Print Overall Report</span>
        </button>
      </div>

      {loading ? (
        <div className="commissions-loading">
          <div className="spinner"></div>
          <p>Loading commission reports...</p>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Cards */}
          <div className="kpi-grid hide-on-print">
            <div className="kpi-card overall">
              <div className="card-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div className="card-info">
                <span>Overall Commission (एकूण कमिशन)</span>
                <h3>₹ {overallCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="kpi-card current-month">
              <div className="card-icon-wrapper">
                <Calendar size={24} />
              </div>
              <div className="card-info">
                <span>Current Month Commission (चालू महिना)</span>
                <h3>₹ {currentMonthCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>
          </div>

          {/* Month Wise Sections */}
          <div className="monthly-sections-wrapper">
            {sortedMonths.length === 0 ? (
              <div className="no-commissions-data">
                <Layers size={40} />
                <p>No bills with commissions found in the database.</p>
              </div>
            ) : (
              sortedMonths.map(monthKey => {
                const monthBills = groupedByMonth[monthKey];
                
                // Group bills inside this month by Date
                const groupedByDate = monthBills.reduce((acc, bill) => {
                  const date = bill.date;
                  if (!acc[date]) {
                    acc[date] = {
                      total: 0,
                      entries: []
                    };
                  }
                  acc[date].total += (bill.commissionAddition || 0);
                  acc[date].entries.push(bill);
                  return acc;
                }, {});

                // Sort dates inside this month descending
                const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
                
                // Total addition for this month
                const monthTotal = monthBills.reduce((acc, bill) => acc + (bill.commissionAddition || 0), 0);

                return (
                  <div key={monthKey} className={`month-group-card ${printingMonth === monthKey ? 'printing-this-month' : ''}`}>
                    <div className="month-group-header">
                      <h3>{formatMonthHeader(monthKey)}</h3>
                      <button className="print-month-btn hide-on-print" onClick={() => handlePrintMonth(monthKey)}>
                        <Printer size={16} />
                        <span>Print Month Report</span>
                      </button>
                    </div>

                    <div className="date-entries-list">
                      {sortedDates.map(dateStr => {
                        const dateData = groupedByDate[dateStr];
                        const isExpanded = !!expandedDates[dateStr] || isPrintingOverall || printingMonth === monthKey;

                        return (
                          <div key={dateStr} className={`date-row-wrapper ${isExpanded ? 'expanded' : ''}`}>
                            <div className="date-row-header" onClick={() => toggleDate(dateStr)}>
                              <div className="date-info">
                                <span className="date-badge">{formatDateDisplay(dateStr)}</span>
                                <span className="date-entries-count">{dateData.entries.length} {dateData.entries.length === 1 ? 'entry' : 'entries'}</span>
                              </div>
                              <div className="date-total-amount">
                                <span className="label">Total Commission:</span>
                                <span className="amount">₹ {dateData.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <button className="accordion-toggle-btn">
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                              </div>
                            </div>

                            {/* Dropdown Content */}
                            {isExpanded && (
                              <div className="expanded-bills-table-wrapper">
                                <table className="expanded-bills-table">
                                  <thead>
                                    <tr>
                                      <th>Merchant Name</th>
                                      <th>Crop Name</th>
                                      <th className="num-col">Qty (Q)</th>
                                      <th className="num-col">Rate (₹)</th>
                                      <th className="num-col">Commission Rate</th>
                                      <th className="num-col">Commission Added</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dateData.entries.map((entry, idx) => (
                                      <tr key={entry._id || idx}>
                                        <td className="font-semibold">{entry.merchantName}</td>
                                        <td>{entry.cropName}</td>
                                        <td className="num-col">{entry.quantity}</td>
                                        <td className="num-col">₹ {entry.rate.toLocaleString('en-IN')}</td>
                                        <td className="num-col">{entry.commissionRate}%</td>
                                        <td className="num-col font-bold text-green-commission">
                                          ₹ {entry.commissionAddition.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* End of Month Total Addition Summary */}
                    <div className="month-total-summary-card">
                      <div className="summary-left">
                        <h4>{formatMonthHeader(monthKey)} Total Addition</h4>
                        <p>Aggregated commission across all bills in this month</p>
                      </div>
                      <div className="summary-right">
                        <span>₹ {monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Commissions;
