import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Users, 
  Upload, 
  Key, 
  Menu, 
  X,
  ChevronDown,
  Calculator
} from 'lucide-react';
import '../csstemplates/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const location = useLocation();

  const toggleMobile = () => {
    setIsOpen(!isOpen);
  };

  const toggleAdminDropdown = () => {
    setAdminDropdownOpen(!adminDropdownOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <Link to="/" className="navbar-brand">
          <BookOpen className="brand-icon" />
          <span>TransGrade.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            {/* Home */}
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Home className="nav-icon" />
              <span>Home</span>
            </Link>

            {/* User Pages */}
            <Link 
              to="/main" 
              className={`nav-link ${isActive('/main') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Users className="nav-icon" />
              <span>Dashboard</span>
            </Link>

            <Link 
              to="/upload" 
              className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Upload className="nav-icon" />
              <span>Upload</span>
            </Link>

            <Link 
              to="/key" 
              className={`nav-link ${isActive('/key') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Key className="nav-icon" />
              <span>Key OCR</span>
            </Link>

            {/* Math Route */}
            <Link 
              to="/math" 
              className={`nav-link ${isActive('/math') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Calculator className="nav-icon" />
              <span>Math</span>
            </Link>

            {/* Admin Dropdown */}
            <div className="nav-dropdown">
              <button 
                className="nav-link dropdown-toggle"
                onClick={toggleAdminDropdown}
              >
                <BookOpen className="nav-icon" />
                <span>Admin</span>
                <ChevronDown className={`dropdown-arrow ${adminDropdownOpen ? 'open' : ''}`} />
              </button>
              
              <div className={`dropdown-menu ${adminDropdownOpen ? 'show' : ''}`}>
                <Link 
                  to="/subjects" 
                  className={`dropdown-item ${isActive('/subjects') ? 'active' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    setAdminDropdownOpen(false);
                  }}
                >
                  <BookOpen className="dropdown-icon" />
                  Subjects
                </Link>
                <Link 
                  to="/classes" 
                  className={`dropdown-item ${isActive('/classes') ? 'active' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    setAdminDropdownOpen(false);
                  }}
                >
                  <Users className="dropdown-icon" />
                  Classes
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-toggle" onClick={toggleMobile}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;