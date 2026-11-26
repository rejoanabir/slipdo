'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Business, Customer } from '../../lib/types';
import { formatMoney } from '../../lib/format';
import { Language } from '../../lib/i18n';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessModal } from '../../components/BusinessModal';
import { UsersIcon, PlusIcon, MailIcon } from '../../components/Icons';

export default function CustomersPage() {
  const [lang, setLang] = useState<Language>('en');
  const [business, setBusiness] = useState<Business>(StorageService.getBusiness());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // New Customer Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    setBusiness(StorageService.getBusiness());
    setCustomers(StorageService.getCustomers());
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      businessId: business.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      address: newAddress.trim(),
      totalSpent: 0,
      receiptCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = StorageService.saveCustomer(newCust);
    setCustomers([...updated]);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setIsAddCustomerOpen(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        business={business}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenBusinessSettings={() => setIsBusinessModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">
              {lang === 'bn' ? 'গ্রাহক তালিকা' : 'Customer Directory'}
            </h1>
            <p className="text-xs text-neutral-500">
              Keep track of regular clients, contact numbers, and purchase history
            </p>
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
          >
            <PlusIcon size={16} />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <input
            type="text"
            placeholder="Search customers by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 w-full sm:w-80 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cust) => (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{cust.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{cust.phone || 'No phone'}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                  {cust.receiptCount} receipts
                </span>
              </div>

              {cust.email && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <MailIcon size={14} className="text-neutral-400" />
                  <span className="truncate">{cust.email}</span>
                </div>
              )}

              {cust.address && (
                <p className="text-xs text-neutral-500 truncate">{cust.address}</p>
              )}

              <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Total Spent:</span>
                <span className="font-extrabold text-emerald-950">
                  {formatMoney(cust.totalSpent, business.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Add New Customer</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Shakib Al Hasan"
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+880 1711-XXXXXX"
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav lang={lang} />

      <BusinessModal
        business={business}
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSave={(updated) => {
          setBusiness(updated);
          StorageService.saveBusiness(updated);
        }}
        lang={lang}
      />
    </div>
  );
}
