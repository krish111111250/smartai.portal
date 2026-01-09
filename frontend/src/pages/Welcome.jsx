// frontend/src/pages/Welcome.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  // Features array for the main grid display
  const featureCategories = [
    { icon: '🎓', title: 'Academic Hub', description: 'Timetable, Attendance, and Course Materials.' },
    { icon: '💳', title: 'Fees & Identity', description: 'Digital ID Card, Fee Status, and Payment Links.' },
    { icon: '🏢', title: 'Campus Facilities', description: 'WiFi, Canteen Menu, Library Access, and Hostel Details.' },
    { icon: '🤝', title: 'Support & Community', description: 'Complaints, Lost & Found, Mentor Details, and Sports.' },
    { icon: '🧠', title: 'Future Ready', description: 'AI Chatbot, Placement Announcements, and Technical Training.' },
  ];

  return (
    // Main Container - Black Background
    <div className="min-h-screen bg-gray-900 flex flex-col items-center text-white font-sans">
      
      {/* 1. Top Header Bar (Black/Red) */}
      <header className="w-full bg-gray-900 shadow-xl sticky top-0 z-20 border-b-4 border-sns-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-extrabold text-sns-primary">SNS</span>
            <span className="text-xl font-medium text-white">Digital Portal</span>
          </div>
          <Link 
            to="/login"
            className="px-6 py-2 bg-sns-primary text-white font-bold rounded-md shadow-lg hover:bg-red-700 transition duration-300"
          >
            Student Login
          </Link>
        </div>
      </header>

      {/* 2. Main Hero Section (Split Layout) */}
      <div className="w-full bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & CTA */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-sns-primary mb-3 block">
              Welcome to the Future
            </span>
            <h1 className="text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
              Your Campus Life, <br />
              <span className="text-sns-primary">Digitally Powered.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-lg">
              The unified portal for all SNS students. Access your CSD academic records, finances, and campus services instantly.
            </p>
            <Link 
                to="/login"
                className="inline-flex items-center px-10 py-3 bg-sns-primary text-white text-lg font-bold rounded-full shadow-2xl hover:bg-red-700 transition duration-300 transform hover:scale-105"
            >
                Start Exploring Now →
            </Link>
          </div>

          {/* Right Column: Visual Accent/Image Placeholder */}
          <div className="hidden lg:block">
            <div className="w-full h-80 bg-cover bg-center rounded-2xl shadow-2xl border-4 border-sns-primary"
                 style={{ 
                   backgroundImage: 'url("https://source.unsplash.com/800x600/?college,code,dark")',
                   backgroundBlendMode: 'overlay',
                   backgroundColor: 'rgba(0, 0, 0, 0.4)'
                 }}>
            </div>
          </div>

        </div>
      </div>
      
      {/* 3. Feature Highlights Section (White background to break up the black) */}
      <main className="w-full bg-white text-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
                  All You Can Do
              </h2>
              <p className="text-xl text-gray-600 mb-16 text-center">
                  A comprehensive overview of every module available in the portal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {featureCategories.map((feature, index) => (
                    <div 
                        key={index} 
                        // White card on white background, using red for highlights
                        className={`p-6 rounded-xl shadow-lg border-t-4 ${index % 2 === 0 ? 'border-sns-primary' : 'border-gray-300'} bg-white hover:shadow-2xl transition duration-300`}
                    >
                        <span className="text-4xl mb-3 block text-sns-primary">{feature.icon}</span>
                        <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
              </div>
          </div>
      </main>

      {/* Footer - Dark Gray */}
      <footer className="w-full bg-gray-800 border-t border-gray-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            © 2024 SNS Smart Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Welcome;