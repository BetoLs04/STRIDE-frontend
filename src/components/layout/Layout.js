import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Header';
import Footer from './Footer';
import '../../styles/App.css';

const Layout = ({ user, onLogout, children }) => {
  return (
    <div className="App">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        theme="colored"
      />
      
      <Header user={user} onLogout={onLogout} />
      
      <main className="main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
