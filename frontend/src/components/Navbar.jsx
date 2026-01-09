// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    // Outer container for the whole Navbar
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* 1. Logo/Portal Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/department/csd" className="text-2xl font-extrabold text-sns-red tracking-wider">
              SNS Smart Portal
            </Link>
          </div>

          {/* 2. Navigation Links */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link to="/department/csd" 
              className="border-b-2 border-transparent text-gray-500 hover:border-sns-red hover:text-sns-red inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150">
              Dashboard
            </Link>
            <Link to="/departments" 
              className="border-b-2 border-transparent text-gray-500 hover:border-sns-red hover:text-sns-red inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150">
              Fees & Payments
            </Link>
            <Link to="/profile" 
              className="border-b-2 border-transparent text-gray-500 hover:border-sns-red hover:text-sns-red inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150">
              Profile
            </Link>
          </div>

          {/* 3. Logout Button/User Info */}
          <div className="flex items-center">
            <button
              onClick={() => { console.log('Logging out...'); /* Add actual logout logic here */ }}
              className="ml-4 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 transition duration-150"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;