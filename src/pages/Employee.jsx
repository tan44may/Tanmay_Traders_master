import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  ArrowLeft,
  UserPlus,
  FileText,
  User,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import './Employee.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const weekdayTranslations = {
  'Sunday': 'रविवार',
  'Monday': 'सोमवार',
  'Tuesday': 'मंगळवार',
  'Wednesday': 'बुधवार',
  'Thursday': 'गुरुवार',
  'Friday': 'शुक्रवार',
  'Saturday': 'शनिवार'
};

const Employee = () => {
  // Navigation State
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Full object when viewing details
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Employee Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empContact, setEmpContact] = useState('');
  const [empWeeklySalary, setEmpWeeklySalary] = useState('');
  const [empRole, setEmpRole] = useState('कामगार');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance Section State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Payment Section State
  const [bankAccounts, setBankAccounts] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payBankId, setPayBankId] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Ledger History state
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendanceForWeek();
      fetchLedger();
    }
  }, [selectedEmployee, selectedDate]);

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employee`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bank`);
      const data = await response.json();
      if (data.success) {
        setBankAccounts(data.data || []);
        if (data.data && data.data.length > 0) {
          setPayBankId(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  // Helper: Get Sunday of the week for date displaying and querying
  const getWeekRange = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust back to Sunday
    const sunday = new Date(d.setDate(diff));
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    return {
      sunday: sunday.toISOString().split('T')[0],
      saturday: saturday.toISOString().split('T')[0],
      sundayObj: sunday
    };
  };

  // Fetch week attendance
  const fetchAttendanceForWeek = async () => {
    if (!selectedEmployee) return;
    try {
      setAttendanceLoading(true);
      const { sunday } = getWeekRange(selectedDate);
      const response = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee._id}/attendance?date=${sunday}`);
      const data = await response.json();
      if (data.success) {
        setAttendanceData(data.data);
      }
    } catch (error) {
      console.error('Error fetching week attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch Ledger transactions
  const fetchLedger = async () => {
    if (!selectedEmployee) return;
    try {
      setLedgerLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee._id}/transactions`);
      const data = await response.json();
      if (data.success) {
        setLedger(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employee ledger:', error);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Create new Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!empName.trim() || !empWeeklySalary) {
      alert('कृपया कर्मचाऱ्याचे नाव आणि साप्ताहिक पगार भरा.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: empName,
          contactNumber: empContact,
          weeklySalary: Number(empWeeklySalary),
          role: empRole,
          joiningDate: empJoiningDate
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setEmpName('');
        setEmpContact('');
        setEmpWeeklySalary('');
        setEmpRole('कामगार');
        fetchEmployees();
      } else {
        alert(data.message || 'कर्मचारी जोडण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('कर्मचारी जोडताना चूक झाली.');
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`तुम्हाला खात्री आहे का की तुम्ही कर्मचारी "${name}" ला डिलीट करू इच्छिता? यामुळे सर्व उपस्थिती आणि व्यवहारांचा इतिहास कायमचा डिलीट होईल.`)) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.message || 'कर्मचारी डिलीट करण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Toggle Attendance day checkbox
  const handleDayCheckboxChange = (dayName) => {
    if (!attendanceData || attendanceData.isFinalized) return;

    const updatedAttendance = attendanceData.attendance.map(d => {
      if (d.day === dayName) {
        return { ...d, present: !d.present };
      }
      return d;
    });

    // Recalculate present count
    const presentCount = updatedAttendance.filter(d => d.present).length;
    const weeklySalary = attendanceData.weeklySalary;
    const calculatedSalary = Number(((weeklySalary * presentCount) / 7).toFixed(2));
    const netSalary = Number((calculatedSalary + attendanceData.bonus - attendanceData.deduction).toFixed(2));

    setAttendanceData({
      ...attendanceData,
      attendance: updatedAttendance,
      calculatedSalary,
      netSalary
    });
  };

  // Handle bonus / deduction manual adjustment changes
  const handleAdjustmentChange = (field, value) => {
    if (!attendanceData || attendanceData.isFinalized) return;
    const valNum = Number(value) || 0;
    
    let bonus = attendanceData.bonus;
    let deduction = attendanceData.deduction;

    if (field === 'bonus') bonus = valNum;
    if (field === 'deduction') deduction = valNum;

    const netSalary = Number((attendanceData.calculatedSalary + bonus - deduction).toFixed(2));

    setAttendanceData({
      ...attendanceData,
      bonus,
      deduction,
      netSalary
    });
  };

  // Save Attendance as draft
  const handleSaveAttendance = async () => {
    if (!attendanceData) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee._id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      const data = await response.json();
      if (data.success) {
        alert('उपस्थिती मसुदा (Draft) यशस्वीरित्या साठवला गेला आहे.');
        setAttendanceData(data.data);
      } else {
        alert(data.message || 'उपस्थिती साठवण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  // Finalize Attendance (creates credit in ledger)
  const handleFinalizeAttendance = async () => {
    if (!attendanceData) return;
    if (!window.confirm('तुम्हाला खात्री आहे का की तुम्ही हा आठवडा अंतिम (Finalize) करू इच्छिता? अंतिम केल्यानंतर या आठवड्याच्या उपस्थितीत बदल करता येणार नाहीत आणि निव्वळ पगार खातेवहीत जमा केला जाईल.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee._id}/attendance/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      const data = await response.json();
      if (data.success) {
        alert('उपस्थिती अंतिम केली गेली आहे आणि पगार खातेवहीत जमा झाला आहे!');
        setAttendanceData(data.data);
        fetchLedger();
        fetchEmployees(); 
      } else {
        alert(data.message || 'उपस्थिती अंतिम करण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error finalizing attendance:', error);
    }
  };

  // Submit payment/advance
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      alert('कृपया योग्य रक्कम टाका.');
      return;
    }
    if (payMethod === 'Bank' && !payBankId) {
      alert('कृपया बँक खाते निवडा.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee._id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: payDate,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          bankAccountId: payMethod === 'Bank' ? payBankId : undefined,
          description: payDescription
        })
      });
      const data = await response.json();
      if (data.success) {
        setPayAmount('');
        setPayDescription('');
        fetchLedger();
        fetchEmployees();
        alert('पेमेंट यशस्वीरित्या नोंदवले गेले आहे आणि खाते शिल्लक अपडेट झाली आहे!');
      } else {
        alert(data.message || 'पेमेंट नोंदवण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('तुम्हाला खात्री आहे का की तुम्ही हा व्यवहार डिलीट करू इच्छिता? यासोबतच कॅशबुक/बँक खात्यातील शिल्लक पूर्ववत होईल.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions/${txnId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchLedger();
        fetchEmployees();
        fetchAttendanceForWeek();
        alert('व्यवहार डिलीट केला गेला आहे.');
      } else {
        alert(data.message || 'व्यवहार डिलीट करण्यात अडचण आली.');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Change date of week navigator
  const handleWeekNav = (direction) => {
    const current = new Date(selectedDate);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 7);
    } else {
      current.setDate(current.getDate() + 7);
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filtering employees
  const filteredEmployees = employees.filter(emp =>
    emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Summarize stats for top overview
  const totalPayable = employees.reduce((acc, emp) => acc + (emp.balance > 0 ? emp.balance : 0), 0);
  const totalAdvances = employees.reduce((acc, emp) => acc + (emp.balance < 0 ? Math.abs(emp.balance) : 0), 0);
  const activeCount = employees.filter(emp => emp.status === 'Active').length;

  return (
    <div className="employee-container">
      {/* 1. Main Employee List Dashboard */}
      {!selectedEmployee ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="employee-header">
            <div>
              <h1 className="gradient-text">कर्मचारी यादी</h1>
              <p className="subtitle-text">कामगारांचे व्यवस्थापन करा, उपस्थिती आणि साप्ताहिक पगार नोंदवा</p>
            </div>
            <button className="add-emp-btn" onClick={() => setShowAddModal(true)}>
              <UserPlus size={18} />
              <span>कर्मचारी जोडा</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="stats-row">
            <div className="stat-card glass-panel">
              <div className="stat-icon-wrapper payable">
                <TrendingUp size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-label">एकूण देय पगार</span>
                <h3 className="stat-value text-green">₹{totalPayable.toFixed(2)}</h3>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrapper advances">
                <TrendingDown size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-label">एकूण दिलेला ॲडव्हान्स (उचल)</span>
                <h3 className="stat-value text-orange">₹{totalAdvances.toFixed(2)}</h3>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrapper active-emp">
                <UserCheck size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-label">सक्रिय कर्मचारी</span>
                <h3 className="stat-value">{activeCount} / {employees.length}</h3>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="search-filter-bar glass-panel">
            <input
              type="text"
              placeholder="कर्मचाऱ्याचे नाव किंवा पदावरून शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="loading-spinner">कर्मचाऱ्यांची माहिती लोड होत आहे...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="empty-state glass-panel">
              <User size={48} className="empty-icon" />
              <p>कोणताही कर्मचारी आढळला नाही. नवीन कर्मचारी जोडण्यासाठी "कर्मचारी जोडा" वर क्लिक करा.</p>
            </div>
          ) : (
            <div className="employee-grid">
              {filteredEmployees.map(emp => (
                <motion.div
                  key={emp._id}
                  className="employee-card glass-panel"
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="card-header-info">
                    <div className="avatar-circle">
                      {emp.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="employee-name-title">{emp.employeeName}</h4>
                      <span className="badge-role">{emp.role}</span>
                    </div>
                  </div>

                  <div className="card-body-details">
                    <div className="detail-item">
                      <Phone size={14} className="detail-icon" />
                      <span>{emp.contactNumber || 'संपर्क क्रमांक नाही'}</span>
                    </div>
                    <div className="detail-item">
                      <DollarSign size={14} className="detail-icon" />
                      <span>दर: <strong>₹{emp.weeklySalary}/साप्ताहिक</strong></span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={14} className="detail-icon" />
                      <span>रुजू तारीख: {new Date(emp.joiningDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="card-balance-section">
                    <span className="balance-lbl">थकीत रक्कम</span>
                    <h4 className={`balance-val ${emp.balance > 0 ? 'text-green' : emp.balance < 0 ? 'text-orange' : ''}`}>
                      {emp.balance > 0 ? `₹${emp.balance.toFixed(2)} (देणे बाकी)` : emp.balance < 0 ? `₹${Math.abs(emp.balance).toFixed(2)} (उचल)` : '₹0.00'}
                    </h4>
                  </div>

                  <div className="card-actions">
                    <button
                      className="view-acct-btn"
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setSelectedDate(new Date().toISOString().split('T')[0]); // Reset to current week
                      }}
                    >
                      खाते आणि उपस्थिती पहा
                    </button>
                    <button
                      className="delete-card-btn"
                      title="कर्मचारी डिलीट करा"
                      onClick={() => handleDeleteEmployee(emp._id, emp.employeeName)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        /* 2. Employee Detailed Account Section (Attendance & Ledger) */
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="detail-header-panel glass-panel">
            <button className="back-btn" onClick={() => {
              setSelectedEmployee(null);
              fetchEmployees(); // Refresh stats on main list
            }}>
              <ArrowLeft size={18} />
              <span>कर्मचारी यादीवर परत जा</span>
            </button>

            <div className="profile-banner">
              <div className="avatar-circle large">
                {selectedEmployee.employeeName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-text">
                <h2>{selectedEmployee.employeeName}</h2>
                <div className="profile-subtext">
                  <span>पद: <strong>{selectedEmployee.role}</strong></span>
                  <span className="separator">•</span>
                  <span>संपर्क: <strong>{selectedEmployee.contactNumber || 'N/A'}</strong></span>
                  <span className="separator">•</span>
                  <span>साप्ताहिक दर: <strong>₹{selectedEmployee.weeklySalary}</strong></span>
                </div>
              </div>
              <div className="profile-balance-badge">
                <span className="badge-lbl">निव्वळ शिल्लक</span>
                <h3 className={`badge-val ${selectedEmployee.balance > 0 ? 'text-green' : selectedEmployee.balance < 0 ? 'text-orange' : ''}`}>
                  {selectedEmployee.balance > 0 ? `₹${selectedEmployee.balance.toFixed(2)}` : selectedEmployee.balance < 0 ? `₹${Math.abs(selectedEmployee.balance).toFixed(2)}` : '₹0.00'}
                </h3>
                <span className="badge-sub">
                  {selectedEmployee.balance > 0 ? 'पगार देणे बाकी' : selectedEmployee.balance < 0 ? 'उचल घेतलेली' : 'पूर्ण नील'}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-layout-grid">
            {/* LEFT COLUMN: ATTENDANCE TRACKER */}
            <div className="detail-column glass-panel">
              <div className="panel-header">
                <Calendar size={18} className="panel-icon" />
                <h3>साप्ताहिक उपस्थिती मागोवा</h3>
              </div>

              {/* Week Navigation */}
              <div className="week-navigator">
                <button className="nav-arrow" onClick={() => handleWeekNav('prev')}>&lt; मागील आठवडा</button>
                <div className="week-range-text">
                  <strong>आठवडा कालावधी:</strong>
                  <span>{getWeekRange(selectedDate).sunday} ते {getWeekRange(selectedDate).saturday}</span>
                </div>
                <button className="nav-arrow" onClick={() => handleWeekNav('next')}>पुढील आठवडा &gt;</button>
              </div>

              {attendanceLoading ? (
                <div className="panel-inner-loading">उपस्थिती लोड होत आहे...</div>
              ) : attendanceData ? (
                <div className="attendance-body">
                  <div className="attendance-info-alert">
                    <AlertCircle size={16} />
                    <span>बाय डिफॉल्ट सर्वांची उपस्थिती (हजर) लावली आहे. गैरहजर असल्यास टिक काढा.</span>
                  </div>

                  {attendanceData.isFinalized && (
                    <div className="finalized-banner">
                      <CheckCircle2 size={18} />
                      <span>हा आठवडा अंतिम (Final) केला आहे. बदल करणे बंद आहे. पगार ₹{attendanceData.netSalary} खात्यात जमा केला आहे.</span>
                    </div>
                  )}

                  {/* Grid of checkboxes Sunday to Saturday */}
                  <div className="weekdays-checkboxes-grid">
                    {weekdays.map(dayName => {
                      const dayObj = attendanceData.attendance.find(a => a.day === dayName) || { present: true };
                      return (
                        <div key={dayName} className={`day-checkbox-card ${dayObj.present ? 'present' : 'absent'} ${attendanceData.isFinalized ? 'locked' : ''}`}>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={dayObj.present}
                              disabled={attendanceData.isFinalized}
                              onChange={() => handleDayCheckboxChange(dayName)}
                            />
                            <div className="day-card-content">
                              <span className="day-name">{weekdayTranslations[dayName]}</span>
                              <span className="day-status">{dayObj.present ? 'हजर' : 'गैरहजर'}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Salary breakdown calculation */}
                  <div className="salary-calculation-box">
                    <h4>पगार गणना</h4>
                    <div className="calc-row">
                      <span>पगार दर (साप्ताहिक):</span>
                      <span>₹{attendanceData.weeklySalary}</span>
                    </div>
                    <div className="calc-row">
                      <span>उपस्थित दिवस:</span>
                      <span>{attendanceData.attendance.filter(a => a.present).length} / 7 दिवस</span>
                    </div>
                    <div className="calc-row highlighted">
                      <span>मोजलेला पगार (दर * उपस्थित/7):</span>
                      <span>₹{attendanceData.calculatedSalary}</span>
                    </div>

                    {/* Adjustments */}
                    <div className="adjustments-section">
                      <div className="adj-field">
                        <label>बोनस (₹)</label>
                        <input
                          type="number"
                          value={attendanceData.bonus}
                          disabled={attendanceData.isFinalized}
                          onChange={(e) => handleAdjustmentChange('bonus', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="adj-field">
                        <label>कपात / वजावट (₹)</label>
                        <input
                          type="number"
                          value={attendanceData.deduction}
                          disabled={attendanceData.isFinalized}
                          onChange={(e) => handleAdjustmentChange('deduction', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="calc-row net-total">
                      <span>निव्वळ पगार (मोजलेला पगार + बोनस - कपात):</span>
                      <span>₹{attendanceData.netSalary}</span>
                    </div>

                    <div className="notes-field">
                      <label>टीप / नोंद</label>
                      <textarea
                        value={attendanceData.notes || ''}
                        disabled={attendanceData.isFinalized}
                        onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                        placeholder="या आठवड्यासाठी नोंद लिहा..."
                        rows={2}
                      />
                    </div>

                    {/* Action buttons */}
                    {!attendanceData.isFinalized && (
                      <div className="attendance-actions">
                        <button className="save-draft-btn" onClick={handleSaveAttendance}>
                          मसुदा साठवा (Draft)
                        </button>
                        <button className="finalize-btn" onClick={handleFinalizeAttendance}>
                          आठवडा अंतिम करा (Final)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="panel-inner-loading">माहिती उपलब्ध नाही.</div>
              )}
            </div>

            {/* RIGHT COLUMN: LEDGER & RECORD PAYMENTS */}
            <div className="detail-column glass-panel">
              <div className="panel-header">
                <DollarSign size={18} className="panel-icon" />
                <h3>पगार आणि खातेवही</h3>
              </div>

              {/* Record Payment Form */}
              <form onSubmit={handleAddPayment} className="payment-form">
                <h4>पगार / उचल नोंदणी</h4>
                <div className="form-grid">
                  <div className="field-group">
                    <label>तारीख</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label>रक्कम (₹)</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="उदा. 5000"
                      required
                      min="1"
                    />
                  </div>

                  <div className="field-group">
                    <label>पेमेंट पद्धत</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="Cash">रोख (कॅशबुक मधून)</option>
                      <option value="Bank">बँक ट्रान्सफर</option>
                    </select>
                  </div>

                  {payMethod === 'Bank' && (
                    <div className="field-group">
                      <label>बँक खाते</label>
                      <select value={payBankId} onChange={(e) => setPayBankId(e.target.value)} required>
                        {bankAccounts.map(acct => (
                          <option key={acct._id} value={acct._id}>
                            {acct.bankName} - {acct.accountHolderName || ''} (₹{acct.balance})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="field-group full-width">
                    <label>तपशील / वर्णन</label>
                    <input
                      type="text"
                      value={payDescription}
                      onChange={(e) => setPayDescription(e.target.value)}
                      placeholder="उदा. उचल पगार, आठवडा पगार जमा"
                    />
                  </div>
                </div>

                <button type="submit" className="submit-pay-btn">
                  पेमेंट नोंदवा
                </button>
              </form>

              {/* Ledger Table */}
              <div className="ledger-table-section">
                <h4>व्यवहारांची खातेवही (Ledger)</h4>
                {ledgerLoading ? (
                  <div className="panel-inner-loading">व्यवहार लोड होत आहेत...</div>
                ) : ledger.length === 0 ? (
                  <div className="empty-ledger">कोणतेही व्यवहार आढळले नाहीत. उपस्थिती अंतिम करा किंवा पेमेंट नोंदवा.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>तारीख</th>
                          <th>तपशील</th>
                          <th>पद्धत</th>
                          <th>जमा (Cr)</th>
                          <th>नावे (Dr)</th>
                          <th>शिल्लक</th>
                          <th>कृती</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map(t => (
                          <tr key={t._id} className={t.type === 'Salary' ? 'credit-row' : 'debit-row'}>
                            <td>{new Date(t.date).toLocaleDateString()}</td>
                            <td className="desc-cell">
                              <span>{t.description}</span>
                            </td>
                            <td>
                              <span className={`method-badge ${t.paymentMethod.toLowerCase()}`}>
                                {t.paymentMethod === 'Cash' ? 'रोख' : t.paymentMethod === 'Bank' ? 'बँक' : '-'}
                              </span>
                            </td>
                            <td className="text-green text-right">
                              {t.type === 'Salary' ? `+₹${t.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="text-orange text-right">
                              {t.type === 'Payment' ? `-₹${t.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className={`text-right font-bold ${t.runningBalance > 0 ? 'text-green' : t.runningBalance < 0 ? 'text-orange' : ''}`}>
                              ₹{t.runningBalance.toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="ledger-delete-btn"
                                title="व्यवहार डिलीट करा"
                                onClick={() => handleDeleteTransaction(t._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-box glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>नवीन कर्मचारी जोडा</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="modal-form">
                <div className="form-group">
                  <label>कर्मचाऱ्याचे पूर्ण नाव *</label>
                  <input
                    type="text"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="नाव टाका"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>संपर्क क्रमांक</label>
                  <input
                    type="text"
                    value={empContact}
                    onChange={(e) => setEmpContact(e.target.value)}
                    placeholder="फोन नंबर टाका"
                  />
                </div>

                <div className="form-group">
                  <label>साप्ताहिक पगार दर (₹) *</label>
                  <input
                    type="number"
                    value={empWeeklySalary}
                    onChange={(e) => setEmpWeeklySalary(e.target.value)}
                    placeholder="दर साप्ताहिक (उदा. 7000)"
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>पद / काम</label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    placeholder="उदा. कामगार, सुपरवायझर, मॅनेजर"
                  />
                </div>

                <div className="form-group">
                  <label>कामावर रुजू तारीख</label>
                  <input
                    type="date"
                    value={empJoiningDate}
                    onChange={(e) => setEmpJoiningDate(e.target.value)}
                  />
                </div>

                <div className="modal-footer-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                    रद्द करा
                  </button>
                  <button type="submit" className="confirm-btn">
                    कर्मचारी तयार करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employee;
