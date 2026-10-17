import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from './ToastContainer';

export const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="page-content-container">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
