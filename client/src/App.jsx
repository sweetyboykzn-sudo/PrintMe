import { Link, Route, Routes } from 'react-router-dom';
import Constructor from './pages/Constructor';
import Admin from './pages/Admin';
import PaymentResult from './pages/PaymentResult';
import React from 'react';
export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold grid place-items-center">T</div>
            <div>
              <div className="font-bold text-lg leading-tight">PrintMe</div>
              <div className="text-xs text-slate-500">Конструктор принтов</div>
            </div>
          </Link>
          <Link to="/admin" className="text-sm text-slate-500 hover:text-blue-600">Админка</Link>
    </div>
      </header>
      <Routes>
        <Route path="/" element={<Constructor />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/payment/result" element={<PaymentResult />} />
      </Routes>
    </div>
  );
}
