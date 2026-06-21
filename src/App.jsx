import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Patti from './pages/Patti';
import Bill from './pages/Bill';
import Merchant from './pages/Merchant';
import Customer from './pages/Customer';
import Crop from './pages/Crop';
import Bank from './pages/Bank';
import DailyBalanceSheet from './pages/DailyBalanceSheet';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isLoading ? (
              <LoadingScreen onComplete={() => setIsLoading(false)} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patti" element={<Patti />} />
          <Route path="bill" element={<Bill />} />
          <Route path="merchant" element={<Merchant />} />
          <Route path="customer" element={<Customer />} />
          <Route path="bank" element={<Bank />} />
          <Route path="daily-balance" element={<DailyBalanceSheet />} />
          <Route path="commissions" element={<div className="content-area"><h2>Commissions Section</h2></div>} />
          <Route path="cashbook" element={<div className="content-area"><h2>Cashbook Section</h2></div>} />
          <Route path="employee" element={<div className="content-area"><h2>Employee Section</h2></div>} />
          <Route path="self" element={<div className="content-area"><h2>Self Section</h2></div>} />
          <Route path="crop" element={<Crop />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
