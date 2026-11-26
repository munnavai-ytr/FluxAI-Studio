'use client';

import { Film, Home, PlusSquare, User } from 'lucide-react';
import type { TabId } from '@/types/studio';

interface StudioNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  hasApiKey: boolean;
}

const NAV_ITEMS: Array<{
  id: TabId;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'new-project', label: 'New Project', icon: PlusSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

export function StudioNav({ activeTab, onSelectTab, hasApiKey }: StudioNavProps) {
  return (
    <>
      {/* Desktop Left Navigation Rail */}
      <aside
        aria-label="Primary Navigation"
        className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen bg-[#0E1118] border-r border-[#232938] px-4 py-6 justify-between"
      >
        <div className="space-y-8">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 px-2 py-1 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20">
              <Film className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap">
              FrameScript
            </span>
          </button>

          <nav className="space-y-1.5" aria-label="Studio Sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                    isActive
                      ? 'bg-[#141821] text-white border border-[#232938] shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#141821]/60 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-[#8B5CF6]' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#141821] border border-[#232938] text-xs font-medium text-slate-300 hover:border-[#343D54] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
        >
          <span className="truncate">Gemini BYOK</span>
          <span
            className={`shrink-0 ${
              hasApiKey ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {hasApiKey ? 'Connected' : 'Setup'}
          </span>
        </button>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar (3 Tabs Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0E1118]/95 backdrop-blur-md border-t border-[#232938] px-2"
      >
        <div className="grid grid-cols-3 h-full max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? 'text-[#8B5CF6]' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-[11px] font-medium leading-none whitespace-nowrap ${
                    isActive ? 'text-[#A5B4FC]' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
