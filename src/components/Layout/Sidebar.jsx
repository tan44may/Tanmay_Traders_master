import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Receipt, 
  Users, 
  UserCircle, 
  Building2, 
  Briefcase, 
  Wallet, 
  UserCheck, 
  UserSquare2
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { name: 'Home', path: '/home', icon: UserCircle },
  { name: 'Patti', path: '/patti', icon: FileText },
  { name: 'Bill', path: '/bill', icon: Receipt },
  { name: 'Merchant', path: '/merchant', icon: Users },
  { name: 'Customer', path: '/customer', icon: UserCircle },
  { name: 'Bank', path: '/bank', icon: Building2 },
  { name: 'Commissions', path: '/commissions', icon: Briefcase },
  { name: 'Cashbook', path: '/cashbook', icon: Wallet },
  { name: 'Employee', path: '/employee', icon: UserCheck },
  { name: 'Self', path: '/self', icon: UserSquare2 },
];

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h3 className="gradient-text">Menu</h3>
      </div>
      
      <div className="sidebar-menu">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.name} 
              to={item.path}
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <motion.div 
                className="menu-item-content"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={20} className="menu-icon" />
                <span>{item.name}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
