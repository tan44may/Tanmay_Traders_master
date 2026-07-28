import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  FileText, 
  Receipt, 
  Wallet, 
  Building2, 
  Users, 
  UserCircle, 
  UserCheck, 
  Briefcase, 
  UserSquare2, 
  RefreshCw,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp as TrendUpIcon,
  Coins
} from 'lucide-react';
import './Dashboard.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

// Custom Donut Chart Component
const DonutChart = ({ data, title }) => {
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  let accumulatedPercent = 0;

  if (totalValue === 0) {
    return (
      <div className="no-entries-placeholder" style={{ minHeight: '160px', width: '100%' }}>
        <AlertCircle size={20} />
        <p>No distribution data available</p>
      </div>
    );
  }

  const chartColors = ['#2E7D32', '#4CAF50', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#374151'];

  const processedData = data.map((item, idx) => ({
    ...item,
    color: item.color || chartColors[idx % chartColors.length]
  }));

  return (
    <div className="donut-chart-layout">
      <div className="donut-svg-wrapper">
        <svg viewBox="0 0 36 36" className="donut-svg" width="100%" height="100%">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          {processedData.map((item, index) => {
            const percent = (item.value / totalValue) * 100;
            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = 100 - accumulatedPercent + 25; // Offset to start at top (12 o'clock)
            accumulatedPercent += percent;
            return (
              <circle
                key={index}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={item.color}
                strokeWidth="3.2"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div className="donut-center-text">
          <p className="title">{title}</p>
          <p className="value">₹ {totalValue >= 100000 ? `${(totalValue / 100000).toFixed(2)}L` : totalValue.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="donut-legend">
        {processedData.map((item, index) => {
          const percent = ((item.value / totalValue) * 100).toFixed(1);
          return (
            <div className="legend-item" key={index}>
              <div className="legend-left">
                <span className="legend-color-dot" style={{ backgroundColor: item.color }} />
                <span className="legend-name" title={item.name}>{item.name}</span>
              </div>
              <span className="legend-value">{percent}% (₹ {item.value.toLocaleString('en-IN')})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom Bar Chart with Trendline Overlay (Green if next is Up, Red if next is Down - matching user screenshot layout)
const TrendLineBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="no-entries-placeholder" style={{ minHeight: '200px', width: '100%' }}>
        <AlertCircle size={20} />
        <p>No comparison data available</p>
      </div>
    );
  }

  // Width and height of SVG canvas
  const width = 500;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);

  // Generate plotting points
  const points = data.map((d, index) => {
    // evenly spaced x coordinates
    const x = paddingLeft + (index * (chartWidth / Math.max(data.length - 1, 1)));
    const y = paddingTop + chartHeight - ((d.value / maxVal) * chartHeight);
    return { x, y, name: d.name, value: d.value };
  });

  return (
    <div className="svg-chart-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ minWidth: '450px' }}>
        <defs>
          <linearGradient id="barBlueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(147, 197, 253, 0.85)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.35)" />
          </linearGradient>
        </defs>

        {/* Y Axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + (chartHeight * ratio);
          const gridVal = maxVal * (1 - ratio);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                ₹ {gridVal >= 100000 ? `${(gridVal / 100000).toFixed(1)}L` : gridVal.toLocaleString('en-IN')}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {points.map((p, index) => {
          const barWidth = Math.min(22, chartWidth / (data.length * 1.8));
          const barHeight = paddingTop + chartHeight - p.y;
          return (
            <g key={index} className="svg-chart-bar-group">
              <rect
                x={p.x - barWidth / 2}
                y={p.y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill="url(#barBlueGrad)"
                rx="3"
              />
              <text x={p.x} y={height - 18} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Segments of trendline with color depending on increase vs decrease */}
        {points.map((p, index) => {
          if (index === 0) return null;
          const prev = points[index - 1];
          const isIncrease = p.value >= prev.value;
          const strokeColor = isIncrease ? '#10b981' : '#ef4444'; // Green if up, Red if down
          return (
            <line
              key={index}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.15))' }}
            />
          );
        })}

        {/* Nodes (Circles) */}
        {points.map((p, index) => {
          let nodeStroke = '#10b981'; // Green for the first node or neutral
          if (index > 0) {
            const prev = points[index - 1];
            nodeStroke = p.value >= prev.value ? '#10b981' : '#ef4444';
          }
          return (
            <g key={index}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5.5"
                fill="#ffffff"
                stroke={nodeStroke}
                strokeWidth="2.5"
              />
              <title>{`${p.name}: ₹ ${p.value.toLocaleString('en-IN')}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Horizontal Progress Bar Ranking Chart
const RankingChart = ({ data, color, type }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="no-entries-placeholder" style={{ minHeight: '150px' }}>
        <p>No ranking data available</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%' }}>
      {data.map((item, index) => {
        const percent = (item.value / maxVal) * 100;
        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-dark)' }}>
                {index + 1}. {item.name}
                {item.subtext && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 500 }}>({item.subtext})</span>}
              </span>
              <strong style={{ color: color || 'var(--primary-green)' }}>
                {type === 'rate' ? `${item.value}% / month` : `₹ ${item.value.toLocaleString('en-IN')}`}
              </strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                style={{
                  height: '100%',
                  background: color || 'var(--primary-green)',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Highest / Lowest Card Component
const HighestLowestCard = ({ type, amount, mainTitle, details }) => {
  if (!amount && amount !== 0) return null;

  return (
    <div className="entry-card">
      <span className={`entry-tag-badge ${type}`}>
        {type}
      </span>
      <div className="entry-amount">
        ₹ {amount.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
        {mainTitle}
      </div>
      <div className="entry-details-grid">
        {details.map((d, index) => (
          <div className="entry-detail-item" key={index}>
            <span className="label">{d.label}</span>
            <span className="value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Selected Section Modal State
  const [selectedSection, setSelectedSection] = useState(null);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/analytics`);
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to retrieve analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Connection to backend failed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-light)', borderTopColor: 'var(--primary-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading detailed analytical dashboards...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center', color: '#c2410c', margin: '2rem' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem auto' }} />
        <h3>Failed to Load Dashboard</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
        <button className="refresh-btn" onClick={fetchAnalytics} style={{ margin: '1.5rem auto 0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  // Aggregate stats for summary cards
  const summaryStats = [
    {
      title: 'Patti Sales Value',
      value: `₹ ${data?.patti?.totalSales?.toLocaleString('en-IN') || 0}`,
      label: `${data?.patti?.count || 0} pattis registered`,
      icon: FileText,
      type: 'sales'
    },
    {
      title: 'Bill Purchases Value',
      value: `₹ ${data?.bill?.totalPurchases?.toLocaleString('en-IN') || 0}`,
      label: `${data?.bill?.count || 0} merchant bills logged`,
      icon: Receipt,
      type: 'purchases'
    },
    {
      title: 'Today Bank Balance',
      value: `₹ ${data?.bank?.totalBalance?.toLocaleString('en-IN') || 0}`,
      label: 'Combined across bank accounts',
      icon: Building2,
      type: 'cash'
    },
    {
      title: 'Net Cashbook Deposits',
      value: `₹ ${((data?.cashbook?.totalDeposits || 0) - (data?.cashbook?.totalWithdrawals || 0)).toLocaleString('en-IN')}`,
      label: `Deposits: ₹${data?.cashbook?.totalDeposits?.toLocaleString('en-IN')} | Withdrawals: ₹${data?.cashbook?.totalWithdrawals?.toLocaleString('en-IN')}`,
      icon: Wallet,
      type: 'cashbook'
    }
  ];

  // Sales vs Purchases Bar Data
  const comparisonData = [
    { name: 'Patti Sales', value: data?.patti?.totalSales || 0 },
    { name: 'Bill Purchases', value: data?.bill?.totalPurchases || 0 }
  ];

  // Cashbook Deposits vs Withdrawals Pie Data
  const cashbookPieData = [
    { name: 'Deposits (जमा)', value: data?.cashbook?.totalDeposits || 0, color: '#10b981' },
    { name: 'Withdrawals (नावे)', value: data?.cashbook?.totalWithdrawals || 0, color: '#f43f5e' }
  ];

  // Investment FD vs RD Pie Data
  const investmentPieData = [
    { name: 'Fixed Deposits (FD)', value: data?.investment?.totalFD || 0, color: '#3b82f6' },
    { name: 'Recurring Deposits (RD)', value: data?.investment?.totalRD || 0, color: '#a78bfa' }
  ];

  // Profit & Loss Calculations
  const investmentVal = 1200000;
  const bankAdd = data?.bank?.totalBalance || 0;
  const bankCalc = 1200000 + bankAdd; // Formula: 1200000 + overall bank outstanding
  const merchAdd = data?.merchant?.totalBalance || 0;
  const custAdd = data?.customer?.totalBalance || 0;
  const cashbookAdd = data?.pnl?.dailyCashbookCash || 0; // Today's daily cashbook cash

  const ourMoney = bankCalc + merchAdd + custAdd + cashbookAdd;
  const diff = ourMoney - investmentVal;
  const isProfit = diff >= 0;

  // Render Detailed Modal Content based on Selected Module
  const renderModalContent = () => {
    if (!selectedSection) return null;

    switch (selectedSection) {
      case 'patti':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Patti Entries</div>
                <div className="val">{data?.patti?.count || 0}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Gross Sales Amount</div>
                <div className="val">₹ {data?.patti?.totalSales?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Avg Patti Value</div>
                <div className="val">₹ {data?.patti?.count > 0 ? Math.round(data.patti.totalSales / data.patti.count).toLocaleString('en-IN') : 0}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Monthly Sales Trend (Patti)</h4>
                <TrendLineBarChart data={data?.patti?.monthlyTrend?.map(d => ({ name: d.month, value: d.value })) || []} />
              </div>
              <div className="detailed-chart-box">
                <h4>Sales Distribution by Crop</h4>
                <DonutChart data={data?.patti?.cropData || []} title="Sales" />
              </div>
            </div>
          </>
        );

      case 'bill':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Bills Generated</div>
                <div className="val">{data?.bill?.count || 0}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Gross Purchases Value</div>
                <div className="val">₹ {data?.bill?.totalPurchases?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Avg Bill Value</div>
                <div className="val">₹ {data?.bill?.count > 0 ? Math.round(data.bill.totalPurchases / data.bill.count).toLocaleString('en-IN') : 0}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Monthly Purchases (Bill Volume)</h4>
                <TrendLineBarChart data={data?.bill?.monthlyTrend?.map(d => ({ name: d.month, value: d.value })) || []} />
              </div>
              <div className="detailed-chart-box">
                <h4>Purchases Distribution by Crop</h4>
                <DonutChart data={data?.bill?.cropData || []} title="Purchases" />
              </div>
            </div>
          </>
        );

      case 'commission':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Commissions Earned</div>
                <div className="val" style={{ color: '#10b981' }}>₹ {data?.commission?.totalEarned?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Highest Commission Bill</div>
                <div className="val">₹ {data?.commission?.highest?.commissionAddition?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Lowest Commission Bill</div>
                <div className="val">₹ {data?.commission?.lowest?.commissionAddition?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: '1fr' }}>
              <div className="detailed-chart-box">
                <h4>Monthly Commissions Trend (Commissions)</h4>
                <TrendLineBarChart data={data?.commission?.monthlyTrend?.map(d => ({ name: d.month, value: d.value })) || []} />
              </div>
            </div>
          </>
        );

      case 'customer': {
        const details = data?.customer?.customerDetails || [];
        const highestInterestCustomers = [...details]
          .sort((a, b) => b.totalInterest - a.totalInterest)
          .slice(0, 5)
          .map(d => ({ name: d.customerName, value: d.totalInterest, subtext: d.contactNumber }));

        const lowestInterestCustomers = [...details]
          .filter(d => d.totalInterest > 0)
          .sort((a, b) => a.totalInterest - b.totalInterest)
          .slice(0, 5)
          .map(d => ({ name: d.customerName, value: d.totalInterest, subtext: d.contactNumber }));

        const highestLenders = [...details]
          .sort((a, b) => b.totalLent - a.totalLent)
          .slice(0, 5)
          .map(d => ({ name: d.customerName, value: d.totalLent, subtext: 'Borrowed from Us' }));

        const lowestLenders = [...details]
          .filter(d => d.totalLent > 0)
          .sort((a, b) => a.totalLent - b.totalLent)
          .slice(0, 5)
          .map(d => ({ name: d.customerName, value: d.totalLent, subtext: 'Borrowed least' }));

        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Registered Farmers</div>
                <div className="val">{details.length}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Net Customer Outstanding</div>
                <div className="val">₹ {data?.customer?.totalBalance?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Total Outstanding Accrued Interest</div>
                <div className="val" style={{ color: '#8b5cf6' }}>
                  ₹ {details.reduce((sum, d) => sum + d.totalInterest, 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Interest Rankings (Highest Accrued Interest)</h4>
                <RankingChart data={highestInterestCustomers} color="#8b5cf6" />
                
                <h4 style={{ marginTop: '1.5rem' }}>Interest Rankings (Lowest Accrued Interest)</h4>
                {lowestInterestCustomers.length > 0 ? (
                  <RankingChart data={lowestInterestCustomers} color="#c084fc" />
                ) : <p style={{ fontSize: '0.8rem', color: '#888' }}>No interest accrued customer data available.</p>}
              </div>

              <div className="detailed-chart-box">
                <h4>Lending Volume: Top Borrowers (Lent More Money)</h4>
                <RankingChart data={highestLenders} color="#f59e0b" />
                
                <h4 style={{ marginTop: '1.5rem' }}>Lending Volume: Lowest Borrowers (Lent Less Money)</h4>
                {lowestLenders.length > 0 ? (
                  <RankingChart data={lowestLenders} color="#fcd34d" />
                ) : <p style={{ fontSize: '0.8rem', color: '#888' }}>No active loan principal found.</p>}
              </div>

              <div className="detailed-chart-box" style={{ gridColumn: 'span 2' }}>
                <h4>Monthly Customer Transactions Comparison (Lent vs Repaid)</h4>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#f59e0b', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Lent (Gave)</h5>
                    <TrendLineBarChart data={data?.customer?.monthlyTrend?.map(d => ({ name: d.month, value: d.lent })) || []} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Repaid (Got)</h5>
                    <TrendLineBarChart data={data?.customer?.monthlyTrend?.map(d => ({ name: d.month, value: d.received })) || []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }

      case 'merchant': {
        const details = data?.merchant?.merchantDetails || [];
        const highestBuyers = [...details]
          .sort((a, b) => b.buyVolume - a.buyVolume)
          .slice(0, 5)
          .map(d => ({ name: d.merchantName, value: d.buyVolume, subtext: `A/C Balance: ₹${d.balance}` }));

        const lowestBuyers = [...details]
          .filter(d => d.buyVolume > 0)
          .sort((a, b) => a.buyVolume - b.buyVolume)
          .slice(0, 5)
          .map(d => ({ name: d.merchantName, value: d.buyVolume, subtext: `A/C Balance: ₹${d.balance}` }));

        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Active Buying Merchants</div>
                <div className="val">{details.length}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Net Payables Outstanding</div>
                <div className="val">₹ {data?.merchant?.totalBalance?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Total Purchasing Turnover</div>
                <div className="val" style={{ color: '#2563eb' }}>
                  ₹ {details.reduce((sum, d) => sum + d.buyVolume, 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Purchasing Share: Top Merchants (Buy More)</h4>
                <RankingChart data={highestBuyers} color="#3b82f6" />
              </div>
              <div className="detailed-chart-box">
                <h4>Purchasing Share: Bottom Merchants (Buy Less)</h4>
                {lowestBuyers.length > 0 ? (
                  <RankingChart data={lowestBuyers} color="#93c5fd" />
                ) : <p style={{ fontSize: '0.8rem', color: '#888' }}>No active merchant transactions logged.</p>}
              </div>

              <div className="detailed-chart-box" style={{ gridColumn: 'span 2' }}>
                <h4>Monthly Merchant Volume Flow Comparison (Paid vs Received)</h4>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#3b82f6', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Paid (Debits)</h5>
                    <TrendLineBarChart data={data?.merchant?.monthlyTrend?.map(d => ({ name: d.month, value: d.gave })) || []} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#8b5cf6', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Received (Credits)</h5>
                    <TrendLineBarChart data={data?.merchant?.monthlyTrend?.map(d => ({ name: d.month, value: d.got })) || []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }

      case 'cashbook':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Deposits</div>
                <div className="val" style={{ color: '#10b981' }}>₹ {data?.cashbook?.totalDeposits?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Total Withdrawals</div>
                <div className="val" style={{ color: '#f43f5e' }}>₹ {data?.cashbook?.totalWithdrawals?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Net Liquid Balance</div>
                <div className="val">₹ {((data?.cashbook?.totalDeposits || 0) - (data?.cashbook?.totalWithdrawals || 0)).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: '1fr' }}>
              <div className="detailed-chart-box">
                <h4>Monthly Cash Flow Comparison (Deposit vs Withdrawal)</h4>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Deposits (जमा)</h5>
                    <TrendLineBarChart data={data?.cashbook?.monthlyFlow?.map(d => ({ name: d.month, value: d.deposit })) || []} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#f43f5e', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Monthly Withdrawals (नावे)</h5>
                    <TrendLineBarChart data={data?.cashbook?.monthlyFlow?.map(d => ({ name: d.month, value: d.withdrawal })) || []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'bank':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Accounts</div>
                <div className="val">{data?.bank?.bankDetails?.length || 0}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Combined Balance</div>
                <div className="val">₹ {data?.bank?.totalBalance?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Account Balances Shares</h4>
                <DonutChart data={data?.bank?.bankData || []} title="Bank Share" />
              </div>
              <div className="detailed-chart-box">
                <h4>Monthly Transactions Comparison (Credits vs Debits)</h4>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <h5 style={{ color: '#10b981', margin: '0 0 8px 0', fontSize: '0.8rem' }}>Credits</h5>
                    <TrendLineBarChart data={data?.bank?.monthlyTrend?.map(d => ({ name: d.month, value: d.credit })) || []} />
                  </div>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <h5 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '0.8rem' }}>Debits</h5>
                    <TrendLineBarChart data={data?.bank?.monthlyTrend?.map(d => ({ name: d.month, value: d.debit })) || []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'employee':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Employee Count</div>
                <div className="val">{data?.employee?.count || 0}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Highest Weekly Salary</div>
                <div className="val">₹ {data?.employee?.highestSalary?.weeklySalary?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box" style={{ gridColumn: 'span 2' }}>
                <h4>Monthly Payroll comparison (Salaries vs Payments)</h4>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#8b5cf6', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Salaries Accrued</h5>
                    <TrendLineBarChart data={data?.employee?.monthlyTrend?.map(d => ({ name: d.month, value: d.salary })) || []} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h5 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.85rem' }}>Payments Disbursed</h5>
                    <TrendLineBarChart data={data?.employee?.monthlyTrend?.map(d => ({ name: d.month, value: d.payment })) || []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'investment':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Invested FD Amount</div>
                <div className="val" style={{ color: '#3b82f6' }}>₹ {data?.investment?.totalFD?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Invested RD Amount</div>
                <div className="val" style={{ color: '#a78bfa' }}>₹ {data?.investment?.totalRD?.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Total Active Investments</div>
                <div className="val">{data?.investment?.count || 0}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>FD vs RD Portfolio Share</h4>
                <DonutChart data={investmentPieData} title="Investments" />
              </div>
              <div className="detailed-chart-box">
                <h4>Monthly Capital Invested (Comparison Bar Graph)</h4>
                <TrendLineBarChart data={data?.investment?.monthlyTrend?.map(d => ({ name: d.month, value: d.value })) || []} />
              </div>
            </div>
          </>
        );

      case 'otherAccount':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Total Misc Accounts</div>
                <div className="val">{data?.otherAccount?.accountsData?.length || 0}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Combined Outstanding Balance</div>
                <div className="val">₹ {data?.otherAccount?.totalBalance?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Other Accounts Balances</h4>
                <TrendLineBarChart data={data?.otherAccount?.accountsData || []} />
              </div>
              <div className="detailed-chart-box">
                <h4>Monthly Miscellaneous Transactions Volume</h4>
                <TrendLineBarChart data={data?.otherAccount?.monthlyTrend?.map(d => ({ name: d.month, value: d.value })) || []} />
              </div>
            </div>
          </>
        );

      case 'pnl':
        return (
          <>
            <div className="detailed-insights-grid">
              <div className="insight-metric-card">
                <div className="lbl">Initial Capital Investment</div>
                <div className="val">₹ {investmentVal.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Total Assets Valuation (Our Money)</div>
                <div className="val" style={{ color: isProfit ? '#10b981' : '#ef4444' }}>₹ {ourMoney.toLocaleString('en-IN')}</div>
              </div>
              <div className="insight-metric-card">
                <div className="lbl">Net Profit / Loss Difference</div>
                <div className="val" style={{ color: isProfit ? '#10b981' : '#ef4444' }}>{isProfit ? '+' : ''}₹ {diff.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="detailed-charts-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="detailed-chart-box">
                <h4>Last 7 Days Net Profit/Loss Trend (P&L Chart)</h4>
                <TrendLineBarChart data={data?.pnl?.pnlHistory || []} />
              </div>
              <div className="detailed-chart-box">
                <h4>Capital Assets Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>BANK ACCOUNTS</span>
                      <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>₹ {bankCalc.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>FARMER OUTSTANDING</span>
                      <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>₹ {custAdd.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>MERCHANT OUTSTANDING</span>
                      <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>₹ {merchAdd.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>TODAY'S CASHBOOK CASH</span>
                      <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>₹ {cashbookAdd.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    if (!selectedSection) return '';
    const sectionNames = {
      patti: 'Patti (Sales) Analytical Analysis',
      bill: 'Bill (Purchases) Detailed Analysis',
      commission: 'Commissions Earnings Analytics',
      customer: 'Customer Interest & Lending Analytics',
      merchant: 'Merchant Purchasing Share Rankings',
      cashbook: 'Cashbook Monthly Liquidity Flows',
      bank: 'Bank Account Balances & Transactions',
      employee: 'Employee Payroll Ledger Summary',
      investment: 'Investments RD & FD Matrix',
      otherAccount: 'Other Miscellaneous Accounts',
      pnl: 'Profit & Loss Statement (लाभ और हानि विवरण)'
    };
    return sectionNames[selectedSection] || 'Analytical Report';
  };

  return (
    <div className="dashboard-analytics-container">
      <div className="dashboard-header">
        <div>
          <h2 className="gradient-text">Analytics & Business Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
            Click on any section card below to view detailed analytics graphs and rankings.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="refresh-btn" onClick={fetchAnalytics} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-overview-grid">
        {summaryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={idx}
              className={`summary-card glass-panel ${stat.type}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className="summary-icon-wrapper">
                <Icon size={24} color="var(--primary-green)" />
              </div>
              <div className="summary-info">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                  {stat.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="charts-dashboard-grid">
        {/* Sales vs Purchases */}
        <motion.div 
          className="chart-card glass-panel"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3><Activity size={18} color="var(--primary-light)" /> Turnover Comparison (Sales vs Purchases)</h3>
          <div className="chart-container-inner">
            <TrendLineBarChart 
              data={comparisonData} 
            />
          </div>
        </motion.div>

        {/* Profit & Loss Section */}
        <motion.div 
          className="chart-card glass-panel"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
          whileHover={{ y: -3 }}
          onClick={() => setSelectedSection('pnl')}
        >
          <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} color={isProfit ? '#10b981' : '#ef4444'} /> Profit & Loss Statement (लाभ और हानि विवरण)
            </span>
            <span className="click-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Click for Graphs <ArrowRight size={11} style={{ display: 'inline', marginLeft: '1px' }} />
            </span>
          </h3>
          
          <div className="profit-loss-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, justifyContent: 'center' }}>
            {/* Visual Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isProfit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: isProfit ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isProfit ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {isProfit ? 'PROFIT (लाभ)' : 'LOSS (हानि)'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NET P&L DIFFERENCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isProfit ? '#10b981' : '#ef4444' }}>
                  {isProfit ? '+' : ''}₹ {diff.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Financial Details Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 550 }}>Capital Investment</span>
                <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹ {investmentVal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 550 }}>Total Capital Assets (Our Money)</span>
                <span style={{ fontWeight: 700, color: isProfit ? '#10b981' : '#ef4444' }}>₹ {ourMoney.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Asset Breakdown details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>BANK ACCOUNTS (1.2M + Bal)</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>₹ {bankCalc.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>FARMER OUTSTANDING</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>₹ {custAdd.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>MERCHANT OUTSTANDING</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>₹ {merchAdd.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>TODAY'S CASHBOOK CASH</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>₹ {cashbookAdd.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison Detail Panels for ALL Sections */}
      <div>
        <h3 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2rem 0 1rem 0' }}>
          Interactive Sections Overview
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '-0.8rem' }}>
          Click on any module card below to open its specific charts and analytical breakdown.
        </p>

        <div className="sections-dashboard-grid">
          
          {/* 1. Patti Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('patti')}>
            <div className="section-panel-header">
              <h4><FileText size={18} color="var(--primary-green)" /> 1. Patti (Sales)</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.patti?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.patti.highest.grandTotal}
                  mainTitle={`${data.patti.highest.cropName} by ${data.patti.highest.customerName}`}
                  details={[
                    { label: 'Merchant', value: data.patti.highest.merchantName },
                    { label: 'Quantity', value: `${data.patti.highest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.patti.highest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.patti.highest.date) }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No data recorded</p></div>}

              {data?.patti?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.patti.lowest.grandTotal}
                  mainTitle={`${data.patti.lowest.cropName} by ${data.patti.lowest.customerName}`}
                  details={[
                    { label: 'Merchant', value: data.patti.lowest.merchantName },
                    { label: 'Quantity', value: `${data.patti.lowest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.patti.lowest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.patti.lowest.date) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 2. Bill Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('bill')}>
            <div className="section-panel-header">
              <h4><Receipt size={18} color="#3b82f6" /> 2. Bill (Purchases)</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.bill?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.bill.highest.grandTotal}
                  mainTitle={`${data.bill.highest.cropName} for ${data.bill.highest.merchantName}`}
                  details={[
                    { label: 'Quantity', value: `${data.bill.highest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.bill.highest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.bill.highest.date) }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No data recorded</p></div>}

              {data?.bill?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.bill.lowest.grandTotal}
                  mainTitle={`${data.bill.lowest.cropName} for ${data.bill.lowest.merchantName}`}
                  details={[
                    { label: 'Quantity', value: `${data.bill.lowest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.bill.lowest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.bill.lowest.date) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 3. Commissions Section (NEW SEPARATED MODULE) */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('commission')}>
            <div className="section-panel-header">
              <h4><Briefcase size={18} color="#ef4444" /> 3. Commissions</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.commission?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.commission.highest.commissionAddition}
                  mainTitle={`Highest Commission: ${data.commission.highest.cropName} for ${data.commission.highest.merchantName}`}
                  details={[
                    { label: 'Bill Weight', value: `${data.commission.highest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.commission.highest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.commission.highest.date) }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No commission data recorded</p></div>}

              {data?.commission?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.commission.lowest.commissionAddition}
                  mainTitle={`Lowest Commission: ${data.commission.lowest.cropName} for ${data.commission.lowest.merchantName}`}
                  details={[
                    { label: 'Bill Weight', value: `${data.commission.lowest.quantity} Q` },
                    { label: 'Rate', value: `₹${data.commission.lowest.rate}/Q` },
                    { label: 'Date', value: formatDate(data.commission.lowest.date) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 4. Cashbook Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('cashbook')}>
            <div className="section-panel-header">
              <h4><Wallet size={18} color="#eab308" /> 4. Cashbook</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.cashbook?.highestDeposit ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.cashbook.highestDeposit.amount}
                  mainTitle={`Highest Deposit: ${data.cashbook.highestDeposit.description}`}
                  details={[
                    { label: 'Type', value: 'deposit (जमा)' },
                    { label: 'Source', value: data.cashbook.highestDeposit.isManual ? 'Manual Entry' : 'Auto Generated' },
                    { label: 'Date', value: formatDate(data.cashbook.highestDeposit.date) }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No deposit recorded</p></div>}

              {data?.cashbook?.highestWithdrawal ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.cashbook.highestWithdrawal.amount}
                  mainTitle={`Highest Withdrawal: ${data.cashbook.highestWithdrawal.description}`}
                  details={[
                    { label: 'Type', value: 'withdrawal (नावे)' },
                    { label: 'Source', value: data.cashbook.highestWithdrawal.isManual ? 'Manual Entry' : 'Auto Generated' },
                    { label: 'Date', value: formatDate(data.cashbook.highestWithdrawal.date) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 5. Bank Accounts Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('bank')}>
            <div className="section-panel-header">
              <h4><Building2 size={18} color="#10b981" /> 5. Bank Accounts</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.bank?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.bank.highest.balance}
                  mainTitle={`Highest Balance: ${data.bank.highest.bankName}`}
                  details={[
                    { label: 'A/C Number', value: data.bank.highest.accountNumber || 'N/A' },
                    { label: 'Holder Name', value: data.bank.highest.accountHolderName || 'N/A' },
                    { label: 'Branch', value: data.bank.highest.branchName || 'N/A' }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No bank account logged</p></div>}

              {data?.bank?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.bank.lowest.balance}
                  mainTitle={`Lowest Balance: ${data.bank.lowest.bankName}`}
                  details={[
                    { label: 'A/C Number', value: data.bank.lowest.accountNumber || 'N/A' },
                    { label: 'Holder Name', value: data.bank.lowest.accountHolderName || 'N/A' },
                    { label: 'Branch', value: data.bank.lowest.branchName || 'N/A' }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 6. Customers Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('customer')}>
            <div className="section-panel-header">
              <h4><UserCircle size={18} color="var(--primary-green)" /> 6. Customers</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.customer?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.customer.highest.balance}
                  mainTitle={`Highest Receivable: ${data.customer.highest.customerName}`}
                  details={[
                    { label: 'Contact', value: data.customer.highest.contactNumber || 'N/A' },
                    { label: 'Status', value: 'Outstanding Debit' }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No customer outstanding balance</p></div>}

              {data?.customer?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.customer.lowest.balance}
                  mainTitle={`Lowest Outstanding: ${data.customer.lowest.customerName}`}
                  details={[
                    { label: 'Contact', value: data.customer.lowest.contactNumber || 'N/A' },
                    { label: 'Status', value: 'Active Farmer' }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 7. Merchants Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('merchant')}>
            <div className="section-panel-header">
              <h4><Users size={18} color="#6366f1" /> 7. Merchants</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.merchant?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.merchant.highest.balance}
                  mainTitle={`Highest Payable: ${data.merchant.highest.merchantName}`}
                  details={[
                    { label: 'Contact', value: data.merchant.highest.contactNumber || 'N/A' },
                    { label: 'Status', value: 'Outstanding Credit' }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No merchant outstanding balance</p></div>}

              {data?.merchant?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.merchant.lowest.balance}
                  mainTitle={`Lowest Outstanding: ${data.merchant.lowest.merchantName}`}
                  details={[
                    { label: 'Contact', value: data.merchant.lowest.contactNumber || 'N/A' },
                    { label: 'Status', value: 'Active Buyer' }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 8. Employees Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('employee')}>
            <div className="section-panel-header">
              <h4><UserCheck size={18} color="#ec4899" /> 8. Employees (Payroll)</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.employee?.highestSalary ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.employee.highestSalary.weeklySalary}
                  mainTitle={`Highest Salary: ${data.employee.highestSalary.employeeName}`}
                  details={[
                    { label: 'Role', value: data.employee.highestSalary.role || 'Worker' },
                    { label: 'Weekly Wage', value: `₹${data.employee.highestSalary.weeklySalary}` },
                    { label: 'Status', value: data.employee.highestSalary.status }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No employees logged</p></div>}

              {data?.employee?.highestTxn ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.employee.highestTxn.amount}
                  mainTitle={`Highest Payroll Payout: ${data.employee.highestTxn.employeeId?.employeeName || 'N/A'}`}
                  details={[
                    { label: 'Type', value: data.employee.highestTxn.type },
                    { label: 'Method', value: data.employee.highestTxn.paymentMethod },
                    { label: 'Date', value: formatDate(data.employee.highestTxn.date) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 9. Investments Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('investment')}>
            <div className="section-panel-header">
              <h4><Briefcase size={18} color="#8b5cf6" /> 9. Investments</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.investment?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.investment.highest.investAmount}
                  mainTitle={`Highest Invested: A/C ${data.investment.highest.accountNumber}`}
                  details={[
                    { label: 'Scheme', value: data.investment.highest.investmentType },
                    { label: 'Maturity Amount', value: `₹${data.investment.highest.maturityAmount.toLocaleString('en-IN')}` },
                    { label: 'Maturity Date', value: formatDate(data.investment.highest.maturityDate) }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No active investments logged</p></div>}

              {data?.investment?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.investment.lowest.investAmount}
                  mainTitle={`Lowest Invested: A/C ${data.investment.lowest.accountNumber}`}
                  details={[
                    { label: 'Scheme', value: data.investment.lowest.investmentType },
                    { label: 'Maturity Amount', value: `₹${data.investment.lowest.maturityAmount.toLocaleString('en-IN')}` },
                    { label: 'Maturity Date', value: formatDate(data.investment.lowest.maturityDate) }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

          {/* 10. Other Accounts Section */}
          <motion.div className="section-analytics-panel glass-panel" whileHover={{ y: -3 }} onClick={() => setSelectedSection('otherAccount')}>
            <div className="section-panel-header">
              <h4><UserSquare2 size={18} color="#6b7280" /> 10. Other Accounts</h4>
              <span className="click-hint">Click for Graphs <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
            </div>
            <div className="section-panel-content">
              {data?.otherAccount?.highest ? (
                <HighestLowestCard 
                  type="highest"
                  amount={data.otherAccount.highest.balance}
                  mainTitle={`Highest Balance: ${data.otherAccount.highest.otherAccountName}`}
                  details={[
                    { label: 'Contact', value: data.otherAccount.highest.contactNumber || 'N/A' },
                    { label: 'Outstanding Balance', value: `₹${data.otherAccount.highest.balance}` }
                  ]}
                />
              ) : <div className="no-entries-placeholder"><p>No other accounts logged</p></div>}

              {data?.otherAccount?.lowest ? (
                <HighestLowestCard 
                  type="lowest"
                  amount={data.otherAccount.lowest.balance}
                  mainTitle={`Lowest Balance: ${data.otherAccount.lowest.otherAccountName}`}
                  details={[
                    { label: 'Contact', value: data.otherAccount.lowest.contactNumber || 'N/A' },
                    { label: 'Outstanding Balance', value: `₹${data.otherAccount.lowest.balance}` }
                  ]}
                />
              ) : null}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Detailed Modal Overlay */}
      <AnimatePresence>
        {selectedSection && (
          <div className="analytics-modal-overlay" onClick={() => setSelectedSection(null)}>
            <motion.div 
              className="analytics-modal-container"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
              <div className="analytics-modal-header">
                <h3>
                  {selectedSection === 'patti' && <FileText size={24} color="var(--primary-green)" />}
                  {selectedSection === 'bill' && <Receipt size={24} color="#3b82f6" />}
                  {selectedSection === 'commission' && <Briefcase size={24} color="#ef4444" />}
                  {selectedSection === 'cashbook' && <Wallet size={24} color="#eab308" />}
                  {selectedSection === 'bank' && <Building2 size={24} color="#10b981" />}
                  {selectedSection === 'customer' && <UserCircle size={24} color="var(--primary-green)" />}
                  {selectedSection === 'merchant' && <Users size={24} color="#6366f1" />}
                  {selectedSection === 'employee' && <UserCheck size={24} color="#ec4899" />}
                  {selectedSection === 'investment' && <Briefcase size={24} color="#8b5cf6" />}
                  {selectedSection === 'otherAccount' && <UserSquare2 size={24} color="#6b7280" />}
                  {getSectionTitle()}
                </h3>
                <button className="analytics-modal-close" onClick={() => setSelectedSection(null)}>
                  <X size={24} />
                </button>
              </div>
              <div className="analytics-modal-body">
                {renderModalContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
