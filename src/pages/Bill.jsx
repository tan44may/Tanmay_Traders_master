import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Save, FileText, List } from 'lucide-react';
import './Bill.css';

const Bill = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [records, setRecords] = useState([]);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    merchantName: '',
    cropName: '',
    quantity: '',
    rate: '',
    tolaiRate: '',
    commissionRate: ''
  });

  // Load records on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('billRecords');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Calculations
  const qty = parseFloat(formData.quantity) || 0;
  const rate = parseFloat(formData.rate) || 0;
  const tRate = parseFloat(formData.tolaiRate) || 0;
  const cRate = parseFloat(formData.commissionRate) || 0;

  const totalAmount = qty * rate;
  const tolaiDeduction = tRate * qty;
  const commissionTotal = (totalAmount * cRate) / 100; // Assuming percentage
  
  const grandTotal = totalAmount - tolaiDeduction + commissionTotal;

  const saveRecord = (print = false) => {
    if (!formData.merchantName || !formData.cropName) {
      alert("Please fill in the required fields (Merchant, Crop).");
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      totalAmount,
      tolaiDeduction,
      commissionTotal,
      grandTotal,
      timestamp: new Date().toLocaleString()
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('billRecords', JSON.stringify(updatedRecords));

    if (print) {
      setTimeout(() => window.print(), 100);
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      merchantName: '',
      cropName: '',
      quantity: '',
      rate: '',
      tolaiRate: '',
      commissionRate: ''
    });
    setActiveTab('records');
  };

  return (
    <div className="bill-module-container">
      {/* Tabs */}
      <div className="tabs-container hide-on-print">
        <button
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => { setActiveTab('new'); setViewingRecord(null); }}
        >
          <FileText size={18} /> New Bill
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
                <label>Date</label>
                <input type="text" readOnly value={viewingRecord.date} />
              </div>
              <div className="form-group">
                <label>Crop Name</label>
                <input type="text" readOnly value={viewingRecord.cropName} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Merchant Name</label>
                <input type="text" readOnly value={viewingRecord.merchantName} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            <div className="form-row grid-cols-4">
              <div className="form-group">
                <label>Quantity</label>
                <input type="text" readOnly value={viewingRecord.quantity} />
              </div>
              <div className="form-group">
                <label>Rate (₹)</label>
                <input type="text" readOnly value={viewingRecord.rate} />
              </div>
              <div className="form-group">
                <label>Tolai Rate</label>
                <input type="text" readOnly value={viewingRecord.tolaiRate} />
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input type="text" readOnly value={viewingRecord.commissionRate} />
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
                <span>Tolai Deduction:</span>
                <span className="deduction">- ₹ {viewingRecord.tolaiDeduction?.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Commission Added:</span>
                <span className="addition">+ ₹ {viewingRecord.commissionTotal?.toFixed(2)}</span>
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
                <label>Merchant Name</label>
                <input type="text" name="merchantName" placeholder="Enter Merchant Name" value={formData.merchantName} onChange={handleInputChange} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            <div className="form-row grid-cols-4">
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" name="quantity" placeholder="0.00" value={formData.quantity} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Rate (₹)</label>
                <input type="number" name="rate" placeholder="0.00" value={formData.rate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Tolai Rate</label>
                <input type="number" name="tolaiRate" placeholder="0.00" value={formData.tolaiRate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input type="number" name="commissionRate" placeholder="0.00" value={formData.commissionRate} onChange={handleInputChange} />
              </div>
            </div>

            <div className="bill-divider-light"></div>

            {/* Calculations Summary */}
            <div className="calculations-section">
              <div className="calc-row">
                <span>Total Amount (Qty × Rate):</span>
                <span>₹ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Tolai Deduction:</span>
                <span className="deduction">- ₹ {tolaiDeduction.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Commission Added:</span>
                <span className="addition">+ ₹ {commissionTotal.toFixed(2)}</span>
              </div>
              <div className="calc-row grand-total-row">
                <span>Grand Total:</span>
                <span>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bill-actions hide-on-print" style={{ display: 'flex', gap: '10px' }}>
            <button className="save-print-btn" onClick={() => saveRecord(false)}>
              <Save size={18} />
              <span>Save</span>
            </button>
            <button className="save-print-btn" onClick={() => saveRecord(true)}>
              <Printer size={18} />
              <span>Save & Print</span>
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
          <h2>Bill Records</h2>
          {records.length === 0 ? (
            <p className="no-records">No records found. Create a new bill to see it here.</p>
          ) : (
            <div className="table-responsive">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant</th>
                    <th>Crop</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} onClick={() => setViewingRecord(record)} style={{ cursor: 'pointer' }} title="Click to view bill">
                      <td>{record.date}</td>
                      <td>{record.merchantName}</td>
                      <td>{record.cropName}</td>
                      <td>{record.quantity}</td>
                      <td>₹{record.rate}</td>
                      <td className="font-bold">₹{record.grandTotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Bill;
