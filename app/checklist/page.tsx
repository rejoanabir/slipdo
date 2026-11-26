'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { FigmaChecklistItem, Business } from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';

export default function ChecklistPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [checklist, setChecklist] = useState<FigmaChecklistItem[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChecklist(StorageService.getChecklist());
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
  }, []);

  const handleToggle = (id: string) => {
    const updated = StorageService.toggleChecklistItem(id);
    setChecklist([...updated]);
  };

  const doneCount = checklist.filter((i) => i.done).length;
  const pct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_1',
    name: 'Bengal Gadget Studio',
    category: 'Electronics & Smart Tech',
    address: 'House #42, Road #11, Banani, Dhaka-1213',
    phone: '+880 1711-000000',
    bin: '002345891-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  // Group checklist items
  const groups = Array.from(new Set(checklist.map((i) => i.group)));

  if (!mounted) {
    return <div className="min-h-screen bg-[#F1F5F9]"></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Brand Palette & Tokens Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900">
              SlipDo Brand Tokens & MFS Color Palette
            </h2>
            <p className="text-xs text-slate-500">
              Hand off these exact variables and tokens to your Figma designer
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-slate-200 bg-emerald-50 text-emerald-950">
              <span className="block w-6 h-6 rounded-md bg-[#059669] mb-2 shadow-xs"></span>
              <p className="font-bold text-xs">Emerald #059669</p>
              <p className="text-[10px] text-slate-500">Primary Brand</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-pink-50 text-pink-950">
              <span className="block w-6 h-6 rounded-md bg-[#E2136E] mb-2 shadow-xs"></span>
              <p className="font-bold text-xs">bKash #E2136E</p>
              <p className="text-[10px] text-slate-500">MFS Brand</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-amber-50 text-amber-950">
              <span className="block w-6 h-6 rounded-md bg-[#F7941D] mb-2 shadow-xs"></span>
              <p className="font-bold text-xs">Nagad #F7941D</p>
              <p className="text-[10px] text-slate-500">MFS Brand</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-purple-50 text-purple-950">
              <span className="block w-6 h-6 rounded-md bg-[#8C3494] mb-2 shadow-xs"></span>
              <p className="font-bold text-xs">Rocket #8C3494</p>
              <p className="text-[10px] text-slate-500">MFS Brand</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
              <span className="block w-6 h-6 rounded-md bg-[#0F172A] mb-2 shadow-xs"></span>
              <p className="font-bold text-xs">Slate #0F172A</p>
              <p className="text-[10px] text-slate-500">Neutral Ink</p>
            </div>
          </div>
        </div>

        {/* Checklist Header & Progress Bar */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 tracking-wider">
                  HANDOFF
                </span>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Figma Deliverables Checklist
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete roadmap of tokens, mobile screens, and vector voucher layouts
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-display font-bold text-sm text-emerald-700">
                  {doneCount} / {checklist.length} Completed
                </span>
                <span className="block text-[11px] text-slate-400">All core tokens covered</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-600 bg-emerald-50 text-emerald-900 font-display font-bold text-xs flex items-center justify-center shrink-0">
                {pct}%
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        {/* Checklist Groups */}
        <div className="space-y-4">
          {groups.map((group) => {
            const itemsInGroup = checklist.filter((i) => i.group === group);
            return (
              <div
                key={group}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft space-y-3"
              >
                <h3 className="font-display font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  {group}
                </h3>
                <div className="space-y-2">
                  {itemsInGroup.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggle(item.id)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 text-xs">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 mr-2 uppercase tracking-wider">
                          {item.tag}
                        </span>
                        <span className={`leading-relaxed ${item.done ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                          {item.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav lang={lang} />

      <BusinessDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        businesses={businesses}
        activeBusiness={currentBiz}
        onSelectBusiness={(b) => {
          setActiveBiz(b);
          StorageService.setActiveBusiness(b.id);
        }}
        lang={lang}
      />
    </div>
  );
}
