import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusCircle, 
  Clipboard, 
  ChevronDown, 
  Globe, 
  Check
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, PinterestIcon, TikTokIcon } from './icons';

export const PLATFORMS = [
  { id: 'auto', name: 'Auto-Detect', icon: Globe, color: 'text-primary' },
  { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, color: 'text-rose-500' },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'text-pink-400' },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestIcon, color: 'text-red-500' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-cyan-400' },
];

export default function InputDock({ onAddToQueue }) {
  const [url, setUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (e) {
      console.error('Clipboard paste failed:', e);
    }
  };

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    onAddToQueue({
      url: url.trim(),
      platform: selectedPlatform.id,
      platformName: selectedPlatform.name,
    });
    setUrl('');
  };

  const SelectedIcon = selectedPlatform.icon;

  return (
    <section className="w-full bg-surface-container-low rounded-xl p-space-xs shadow-md border border-[#27272a]">
      <form 
        onSubmit={handleAdd}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-xs bg-surface-container rounded-lg p-space-xs"
      >
        {/* Platform Selector Dropdown */}
        <div className="relative min-w-[170px] shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-space-md py-2.5 bg-surface-container-high rounded-md hover:bg-surface-container-highest transition-colors border border-[#3f3f46]/40 text-left"
          >
            <div className="flex items-center gap-space-sm">
              <SelectedIcon className={`w-4 h-4 ${selectedPlatform.color}`} />
              <span className="font-medium text-[12px] text-on-surface">
                {selectedPlatform.name}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Elevated Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-surface-container-high rounded-lg shadow-2xl py-1 z-40 border border-[#3f3f46]">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform.id === platform.id;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-space-md py-2 text-[12px] flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-surface-container-highest text-primary font-medium' 
                        : 'text-on-surface hover:bg-surface-container-highest/70'
                    }`}
                  >
                    <div className="flex items-center gap-space-sm">
                      <Icon className={`w-4 h-4 ${platform.color}`} />
                      <span>{platform.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: URL Input Field */}
        <div className="relative flex-1 flex items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video link here (YouTube, Instagram Reel, TikTok, Pinterest)..."
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-[13px] px-space-lg py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 border border-transparent focus:border-primary/40 transition-colors"
          />
          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="absolute right-space-sm flex items-center gap-1 px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors border border-[#3f3f46]/30 text-[11px] font-mono"
          >
            <Clipboard className="w-3 h-3 text-primary" />
            <span className="uppercase tracking-wider">Paste</span>
          </button>
        </div>

        {/* Right: Primary Add to Queue CTA */}
        <button
          type="submit"
          disabled={!url.trim()}
          className="shrink-0 flex items-center justify-center gap-space-sm bg-primary text-on-primary font-medium text-[12px] px-space-xl py-2.5 rounded-md hover:bg-primary-fixed transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          <PlusCircle className="w-4 h-4 text-on-primary" />
          <span>Add to Queue</span>
        </button>
      </form>
    </section>
  );
}
