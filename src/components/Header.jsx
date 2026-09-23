import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function Header({ 
  activeTab, 
  onTabChange, 
  isEngineReady,
  instagramStatus,
  onConnectInstagram,
  onLogoutInstagram,
}) {
  const isMac = window.electronAPI?.platform === 'darwin';

  const handleMinimize = () => window.electronAPI?.minimizeWindow?.();
  const handleMaximize = () => window.electronAPI?.maximizeWindow?.();
  const handleClose = () => window.electronAPI?.closeWindow?.();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-[#27272a] app-drag-region">
      <div className="h-14 w-full px-gutter flex items-center justify-between">
        {/* Left: Traffic light spacing & Brand identity */}
        <div className="flex items-center gap-space-lg">
          {isMac && <div className="w-16 h-4" />}

          <div className="flex items-center gap-space-sm pl-space-xs app-no-drag">
            {/* SVG Logo Mark */}
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-surface-container-high p-1 border border-[#3f3f46]">
              <svg viewBox="0 0 512 512" className="w-full h-full">
                <defs>
                  <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <path d="M 170 160 C 170 160, 256 120, 342 160" fill="none" stroke="#3b82f6" strokeWidth="24" strokeLinecap="round" opacity="0.5"/>
                <path d="M 140 200 C 140 200, 256 150, 372 200" fill="none" stroke="#60a5fa" strokeWidth="28" strokeLinecap="round" opacity="0.8"/>
                <path d="M 256 180 L 256 340 M 190 274 L 256 340 L 322 274" fill="none" stroke="url(#primaryGrad)" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <span className="font-semibold text-[13px] text-on-surface tracking-tight">
              Universal Media Downloader
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-high px-space-xs py-[1px] rounded border border-[#3f3f46]/50">
              v2.4 Pro
            </span>
          </div>
        </div>

        {/* Center: Navigation segmented control */}
        <div className="flex items-center app-no-drag">
          <nav className="flex items-center gap-space-xs bg-surface-container px-space-xs py-space-xs rounded-lg border border-[#27272a]">
            {[
              { id: 'downloader', label: 'Downloader' },
              { id: 'queue', label: 'Queue Manager' },
              { id: 'history', label: 'Activity History' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-space-md py-space-xs transition-colors rounded text-[12px] font-medium ${
                  activeTab === tab.id
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Engine Status Pill, Instagram Auth & Windows controls */}
        <div className="flex items-center gap-space-md app-no-drag">
          {/* Instagram Session Indicator */}
          {instagramStatus?.connected ? (
            <div className="flex items-center gap-1.5 px-space-sm py-[3px] rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>IG Connected</span>
              <button
                onClick={onLogoutInstagram}
                title="Disconnect Instagram Session"
                className="ml-1 text-pink-400/60 hover:text-pink-300 text-[11px] font-bold"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectInstagram}
              className="flex items-center gap-1.5 px-space-sm py-[3px] rounded-full bg-surface-container hover:bg-surface-container-high border border-pink-500/30 text-pink-300 hover:text-pink-200 text-[11px] font-medium transition"
              title="Connect Instagram account to download carousels and private feed posts"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span>Connect IG</span>
            </button>
          )}

          <div className="flex items-center gap-space-xs px-space-sm py-[3px] rounded-full bg-surface-container border border-[#27272a]">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                isEngineReady
                  ? 'bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.6)]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-medium text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isEngineReady ? 'Engine Active' : 'Initializing Binaries'}
            </span>
          </div>


          {!isMac && (
            <div className="flex items-center gap-1 border-l border-[#27272a] pl-2">
              <button
                type="button"
                onClick={handleMinimize}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleMaximize}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
