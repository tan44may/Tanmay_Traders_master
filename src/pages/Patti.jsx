import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Save, FileText, List, Trash2 } from 'lucide-react';
import './Patti.css';

const Patti = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    merchantName: '',
    cropName: '',
    quantity: '',
    rate: '',
    hamaliRate: '',
    tolaiRate: '',
    other: ''
  });

  // Load records on mount
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('https://tanmay-traders.vercel.app/api/patti');
        const data = await response.json();
        if (data.success) {
          setRecords(data.data);
        }
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };
    fetchRecords();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const deleteRecord = async (e, id) => {
    e.stopPropagation(); // Prevent opening the view modal
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      setLoading(true);
      const response = await fetch(`https://tanmay-traders.vercel.app/api/patti/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setRecords(records.filter(r => (r._id || r.id) !== id));
        alert(data.message);
      } else {
        alert("Failed to delete: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting patti:", error);
      alert("Error deleting patti");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const qty = parseFloat(formData.quantity) || 0;
  const rate = parseFloat(formData.rate) || 0;
  const hRate = parseFloat(formData.hamaliRate) || 0;
  const tRate = parseFloat(formData.tolaiRate) || 0;
  const other = parseFloat(formData.other) || 0; // Other isn't strictly defined in total calculation, but we parse it

  const hamaliTotal = hRate * qty;
  const tolaiTotal = tRate * qty;
  const grandTotal = (qty * rate) - (hamaliTotal + tolaiTotal + other);

  const saveRecord = async (print = false) => {
    if (!formData.customerName || !formData.merchantName || !formData.cropName) {
      alert("Please fill in the required fields (Customer, Merchant, Crop).");
      return;
    }

    const payload = {
      date: formData.date,
      cropName: formData.cropName,
      customerName: formData.customerName,
      merchantName: formData.merchantName,
      quantity: qty,
      rate: rate,
      hamaliRate: hRate,
      tolaiRate: tRate,
      otherCharges: other,
      totalAmount: qty * rate,
      hamaliDeduction: hamaliTotal,
      tolaiDeduction: tolaiTotal,
      grandTotal: grandTotal
    };

    try {
      setLoading(true);
      const response = await fetch('https://tanmay-traders.vercel.app/api/patti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        // Automatically create a corresponding bill
        try {
          const bTotalAmount = qty * rate;
          const bTolaiDeduction = tRate * qty;
          const bCommissionTotal = (bTotalAmount * 1) / 100;
          const bGrandTotal = bTotalAmount - bTolaiDeduction + bCommissionTotal;

          const billPayload = {
            date: formData.date,
            merchantName: formData.merchantName,
            cropName: formData.cropName,
            quantity: qty,
            rate: rate,
            tolaiRate: tRate,
            commissionRate: 1,
            totalAmount: bTotalAmount,
            tolaiDeduction: bTolaiDeduction,
            commissionAddition: bCommissionTotal,
            grandTotal: bGrandTotal
          };
          const billResponse = await fetch('https://tanmay-traders.vercel.app/api/bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billPayload)
          });
          const billData = await billResponse.json();
          if (!billData.success) {
            console.error("Failed to automatically create bill:", billData.message);
          }
        } catch (billError) {
          console.error("Error automatically creating bill:", billError);
        }

        setRecords([data.data, ...records]);
        if (print) {
          window.print();
        }
        
        setFormData({
          date: new Date().toISOString().split('T')[0],
          customerName: '',
          merchantName: '',
          cropName: '',
          quantity: '',
          rate: '',
          hamaliRate: '',
          tolaiRate: '',
          other: ''
        });
        setActiveTab('records');
      } else {
        alert("Failed to save patti: " + data.message);
      }
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Error saving record");
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

  // Group and calculate records
  const groupedPattis = (records || []).reduce((groups, record) => {
    const date = record.date?.split('T')[0] || record.date || 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedPattis).sort((a, b) => new Date(b) - new Date(a));
  const overallTotal = (records || []).reduce((sum, r) => sum + Number(r.grandTotal || 0), 0);

  return (
    <div className="patti-container">
      {/* Tabs */}
      <div className="tabs-container hide-on-print">
        <button
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => { setActiveTab('new'); setViewingRecord(null); }}
        >
          <FileText size={18} /> New Patti
        </button>
        <button
          className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => { setActiveTab('records'); setViewingRecord(null); }}
        >
          <List size={18} /> Records
        </button>
      </div>

      {viewingRecord ? (
        <motion.div
          className="bill-wrapper glass-panel printable-area"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Bill Header */}
          <div className="bill-header">
            <h1 className="firm-name">Tanmay Traders</h1>
            <p className="firm-desc">Soybean, Cotton, Tur, & All types of grains commission agent</p>
            <p className="firm-address">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
            <p className="firm-contact">Mo. No: 9011874112</p>
          </div>

          <div className="bill-divider"></div>

          {/* Form Fields (Read Only) */}
          <div className="bill-form">
            <div className="form-row">
              <div className="form-group">
                <label>Date & Time</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" readOnly value={formatDate(viewingRecord.date)} style={{ flex: 1 }} />
                  <input type="text" readOnly value={formatTime(viewingRecord.date, viewingRecord.createdAt)} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Crop Name</label>
                <input type="text" readOnly value={viewingRecord.cropName} />
              </div>
            </div>

            <div className="form-row">
              <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Customer Name</label>
                  <input type="text" readOnly value={viewingRecord.customerName} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Merchant Name</label>
                  <input type="text" readOnly value={viewingRecord.merchantName} />
                </div>
              </div>
            </div>

            <div className="bill-divider-light"></div>

            <div className="form-row grid-cols-4">
              <div className="form-group">
                <label>Quantity (Qtl)</label>
                <input type="text" readOnly value={viewingRecord.quantity} />
              </div>
              <div className="form-group">
                <label>Rate (₹)</label>
                <input type="text" readOnly value={viewingRecord.rate} />
              </div>
              <div className="form-group">
                <label>Hamali Rate</label>
                <input type="text" readOnly value={viewingRecord.hamaliRate} />
              </div>
              <div className="form-group">
                <label>Tolai Rate</label>
                <input type="text" readOnly value={viewingRecord.tolaiRate} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Other Charges</label>
                <input type="text" readOnly value={viewingRecord.otherCharges || 0} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            {/* Calculations Summary */}
            <div className="calculations-section">
              <div className="calc-row">
                <span>Total Amount (Qty × Rate):</span>
                <span>₹ {viewingRecord.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Hamali Deduction:</span>
                <span className="deduction">- ₹ {viewingRecord.hamaliDeduction?.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Tolai Deduction:</span>
                <span className="deduction">- ₹ {viewingRecord.tolaiDeduction?.toFixed(2)}</span>
              </div>
              <div className="calc-row grand-total-row">
                <span>Grand Total:</span>
                <span>₹ {viewingRecord.grandTotal?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bill-actions hide-on-print" style={{ display: 'flex', gap: '10px' }}>
            <button className="save-print-btn" onClick={() => setViewingRecord(null)}>
              <span>Back</span>
            </button>
            <button className="save-print-btn" onClick={() => window.print()}>
              <Printer size={18} />
              <span>Print</span>
            </button>
          </div>
        </motion.div>
      ) : activeTab === 'new' ? (
        <motion.div
          className="bill-wrapper glass-panel printable-area"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Bill Header */}
          <div className="bill-header">
            <h1 className="firm-name">Tanmay Traders</h1>
            <p className="firm-desc">Soybean, Cotton, Tur, & All types of grains commission agent</p>
            <p className="firm-address">Krushi Utpanna Bazar Samiti, Karanja (Lad) Dist. Washim</p>
            <p className="firm-contact">Mo. No: 9011874112</p>
          </div>

          <div className="bill-divider"></div>

          {/* Form Fields */}
          <div className="bill-form">
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Crop Name</label>
                <input type="text" name="cropName" placeholder="e.g. Soybean" value={formData.cropName} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Customer Name</label>
                <input type="text" name="customerName" placeholder="Enter Customer Name" value={formData.customerName} onChange={handleInputChange} />
              </div>
              <div className="form-group flex-2">
                <label>Merchant Name</label>
                <input type="text" name="merchantName" placeholder="Enter Merchant Name" value={formData.merchantName} onChange={handleInputChange} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            <div className="form-row grid-cols-4">
              <div className="form-group">
                <label>Quantity (Qtl)</label>
                <input type="number" name="quantity" placeholder="0.00" value={formData.quantity} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Rate (₹)</label>
                <input type="number" name="rate" placeholder="0.00" value={formData.rate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Hamali Rate</label>
                <input type="number" name="hamaliRate" placeholder="0.00" value={formData.hamaliRate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Tolai Rate</label>
                <input type="number" name="tolaiRate" placeholder="0.00" value={formData.tolaiRate} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Other Charges</label>
                <input type="number" name="other" placeholder="0.00" value={formData.other} onChange={handleInputChange} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            {/* Calculations Summary */}
            <div className="calculations-section">
              <div className="calc-row">
                <span>Total Amount (Qty × Rate):</span>
                <span>₹ {(qty * rate).toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Hamali Deduction:</span>
                <span className="deduction">- ₹ {hamaliTotal.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Tolai Deduction:</span>
                <span className="deduction">- ₹ {tolaiTotal.toFixed(2)}</span>
              </div>
              <div className="calc-row grand-total-row">
                <span>Grand Total:</span>
                <span>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bill-actions hide-on-print" style={{ display: 'flex', gap: '10px' }}>
            <button className="save-print-btn" onClick={() => saveRecord(false)} disabled={loading}>
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
            <button className="save-print-btn" onClick={() => saveRecord(true)} disabled={loading}>
              <Printer size={18} />
              <span>{loading ? 'Saving...' : 'Save & Print'}</span>
            </button>
          </div>

        </motion.div>
      ) : (
        <motion.div
          className="records-wrapper glass-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2>Patti Records</h2>
          {records.length === 0 ? (
            <p className="no-records">No records found. Create a new patti to see it here.</p>
          ) : (
            <>
              {sortedDates.map(date => {
                const dateGroup = groupedPattis[date];
                const dayTotal = dateGroup.reduce((sum, r) => sum + Number(r.grandTotal || 0), 0);
                
                return (
                  <div key={date} className="date-records-group" style={{ marginBottom: '30px' }}>
                    <div className="date-group-header" style={{ 
                      background: '#e8f5e9', 
                      padding: '10px 15px', 
                      borderRadius: '8px', 
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: '700', color: '#2e7d32' }}>{formatDate(date)}</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>Day Total: ₹{dayTotal.toFixed(2)}</span>
                    </div>
                    <div className="table-responsive">
                      <table className="records-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Customer</th>
                            <th>Merchant</th>
                            <th>Crop</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Total (₹)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...dateGroup].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((record) => (
                            <tr key={record._id || record.id} onClick={() => setViewingRecord(record)} style={{ cursor: 'pointer' }} title="Click to view patti">
                              <td style={{ fontSize: '0.85rem', color: '#666' }}>{formatTime(record.date, record.createdAt)}</td>
                              <td>{record.customerName}</td>
                              <td>{record.merchantName}</td>
                              <td>{record.cropName}</td>
                              <td>{record.quantity}</td>
                              <td>₹{record.rate}</td>
                              <td className="font-bold">₹{Number(record.grandTotal || 0).toFixed(2)}</td>
                              <td>
                                <button 
                                  className="delete-btn" 
                                  onClick={(e) => deleteRecord(e, record._id || record.id)}
                                  title="Delete Record"
                                  style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              <div className="records-footer-summary" style={{ 
                marginTop: '20px', 
                padding: '20px', 
                background: '#2e7d32', 
                color: 'white', 
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Overall Total (All Patti):</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹ {overallTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Patti;
