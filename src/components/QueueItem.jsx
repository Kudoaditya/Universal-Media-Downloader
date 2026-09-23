import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Sliders, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Globe,
  Image as ImageIcon,
  FileText,
  Check,
  RefreshCw
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, PinterestIcon, TikTokIcon } from './icons';
import InspectorPanel from './InspectorPanel';

const PLATFORM_ICONS = {
  youtube: { icon: YoutubeIcon, color: 'text-rose-500', name: 'YouTube' },
  instagram: { icon: InstagramIcon, color: 'text-pink-400', name: 'Instagram' },
  pinterest: { icon: PinterestIcon, color: 'text-red-500', name: 'Pinterest' },
  tiktok: { icon: TikTokIcon, color: 'text-cyan-400', name: 'TikTok' },
  auto: { icon: Globe, color: 'text-primary', name: 'Web Media' },
};

function formatSeconds(secs) {
  if (!secs) return '00:00';
  const hrs = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function QueueItem({ 
  item, 
  onTogglePlayPause, 
  onRemove, 
  onUpdateConfig,
  instagramStatus,
  onConnectInstagram,
  onRefreshMetadata
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickNotice, setQuickNotice] = useState('');
  const isYouTube = item.platform === 'youtube';
  const platformInfo = PLATFORM_ICONS[item.platform] || PLATFORM_ICONS.auto;
  const PlatformIcon = platformInfo.icon;

  const isPaused = item.status === 'paused';
  const isActive = item.status === 'active' || item.status === 'downloading';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';

  const handleQuickDownloadThumbnail = async (e) => {
    e.stopPropagation();
    try {
      if (window.electronAPI?.downloadThumbnail) {
        await window.electronAPI.downloadThumbnail(item.id);
        setQuickNotice('Thumbnail saved!');
      } else {
        window.open(item.thumbnail || `https://i.ytimg.com/vi/${item.url.split('v=')[1]?.slice(0,11)}/maxresdefault.jpg`, '_blank');
        setQuickNotice('Opened thumbnail!');
      }
    } catch (_) {
      setQuickNotice('Download failed');
    }
    setTimeout(() => setQuickNotice(''), 2500);
  };

  const handleQuickSaveMetadata = async (e) => {
    e.stopPropagation();
    try {
      if (window.electronAPI?.saveMetadata) {
        await window.electronAPI.saveMetadata(item.id, 'txt');
        setQuickNotice('Info saved (.txt)!');
      } else {
        const text = `TITLE: ${item.title}\nTAGS: ${(item.tags || []).join(', ')}\n\nDESCRIPTION:\n${item.description || ''}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(item.title || 'media').slice(0, 30)} - Description.txt`;
        a.click();
        setQuickNotice('Downloaded .txt!');
      }
    } catch (_) {
      setQuickNotice('Failed saving');
    }
    setTimeout(() => setQuickNotice(''), 2500);
  };

  return (
    <article className="w-full bg-surface-container-low rounded-xl border border-[#27272a] shadow-sm overflow-hidden flex flex-col transition-all hover:border-[#3f3f46]">
      {/* Primary Card Row */}
      <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
        {/* Left: 16:9 Thumbnail & Metadata */}
        <div className="flex items-start gap-space-lg min-w-0 flex-1">
          {/* Thumbnail Container */}
          <div className="relative w-36 h-20 shrink-0 rounded-lg overflow-hidden bg-surface-container-lowest border border-[#27272a] flex items-center justify-center group">
            {item.thumbnail ? (
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-lowest flex items-center justify-center">
                <PlatformIcon className={`w-8 h-8 ${platformInfo.color} opacity-70`} />
              </div>
            )}

            {/* Quick 1-click thumbnail hover button */}
            <button
              type="button"
              onClick={handleQuickDownloadThumbnail}
              title="Download High-Res Thumbnail"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white text-[10px] font-medium"
            >
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>Get Thumbnail</span>
            </button>

            {/* Platform badge overlay */}
            <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#3f3f46]/40 pointer-events-none">
              <PlatformIcon className={`w-3 h-3 ${platformInfo.color}`} />
              <span className="font-mono text-[10px] text-on-surface">
                {platformInfo.name}
              </span>
            </div>

            {/* Duration Tag */}
            <div className="absolute top-1 left-1 bg-surface-container-lowest/80 backdrop-blur-sm px-1.5 py-0.5 rounded font-mono text-[10px] text-primary border border-[#3f3f46]/30 pointer-events-none">
              {item.durationText || formatSeconds(item.durationSec || 222)}
            </div>
          </div>

          {/* Metadata Column */}
          <div className="flex flex-col gap-space-xs min-w-0 flex-1">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h2 className="font-semibold text-[13px] text-on-surface truncate max-w-lg" title={item.title}>
                {item.title || item.url}
              </h2>

              {/* Status Pill Badge */}
              {isActive && (
                <span className="font-mono text-[11px] text-tertiary bg-tertiary-container/30 px-space-xs py-[1px] rounded border border-tertiary/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  Active
                </span>
              )}
              {isPaused && (
                <span className="font-mono text-[11px] text-amber-400 bg-amber-400/10 px-space-xs py-[1px] rounded border border-amber-400/20">
                  Paused
                </span>
              )}
              {isCompleted && (
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-400/10 px-space-xs py-[1px] rounded border border-emerald-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
              {isError && (
                <span className="font-mono text-[11px] text-rose-400 bg-rose-400/10 px-space-xs py-[1px] rounded border border-rose-400/20 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Error
                </span>
              )}
              {item.status === 'queued' && (
                <span className="font-mono text-[11px] text-primary bg-primary/10 px-space-xs py-[1px] rounded border border-primary/20">
                  Queued
                </span>
              )}
              {item.status === 'fetching-metadata' && (
                <span className="font-mono text-[11px] text-amber-400 bg-amber-400/10 px-space-xs py-[1px] rounded border border-amber-400/20 flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Fetching…
                </span>
              )}

              {quickNotice && (
                <span className="font-mono text-[11px] text-tertiary bg-tertiary/15 px-2 py-0.5 rounded border border-tertiary/30 animate-pulse">
                  {quickNotice}
                </span>
              )}
            </div>

            {/* Specification Pill Badges */}
            <div className="flex items-center gap-space-xs flex-wrap pt-0.5">
              <span className="font-mono text-[11px] text-primary bg-surface-container-high px-space-sm py-[2px] rounded-full border border-[#3f3f46]/40">
                {item.config?.format === 'thumbnail_only' 
                  ? 'Thumbnail Only' 
                  : item.config?.format === 'metadata_only' 
                  ? 'Metadata Only' 
                  : `${item.config?.resolution?.toUpperCase() || '1080P'} • ${item.config?.format === 'audio_only' ? 'Audio' : 'Video'}`}
              </span>
              
              {isYouTube && item.config?.format !== 'thumbnail_only' && item.config?.format !== 'metadata_only' && (
                <span className="font-mono text-[11px] text-secondary bg-surface-container-high px-space-sm py-[2px] rounded-full border border-[#3f3f46]/40">
                  Trim: {formatSeconds(item.config?.trimStart || 0)} – {formatSeconds(item.config?.trimEnd || item.durationSec || 222)}
                </span>
              )}

              {item.carousel?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="font-mono text-[11px] text-tertiary bg-tertiary/15 hover:bg-tertiary/25 px-space-sm py-[2px] rounded-full border border-tertiary/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="View Carousel & Images"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{item.carousel.length} Images</span>
                </button>
              )}

              {item.requiresInstagramAuth && (
                <button
                  type="button"
                  onClick={() => onConnectInstagram && onConnectInstagram()}
                  className="font-mono text-[11px] text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-space-sm py-[2px] rounded-full border border-pink-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Connect Instagram to extract carousel & high-res media"
                >
                  <AlertCircle className="w-3 h-3 text-pink-400" />
                  <span>IG Login Needed</span>
                </button>
              )}

              {isYouTube && item.tags?.length > 0 && (
                <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-high px-space-sm py-[2px] rounded-full border border-[#3f3f46]/40">
                  {item.tags.length} Tags
                </span>
              )}

              {item.uploader && (
                <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-high px-space-sm py-[2px] rounded-full border border-[#3f3f46]/40">
                  @{item.uploader}
                </span>
              )}
            </div>

            {/* Progress Bar & Real-Time Telemetry */}
            <div className="flex flex-col gap-space-xs mt-space-xs w-full max-w-xl">
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-tertiary' : isPaused ? 'bg-amber-400' : 'bg-primary'
                  }`} 
                  style={{ width: `${item.progress || (isCompleted ? 100 : 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
                <div className="flex items-center gap-space-md">
                  <span className="text-primary font-medium">
                    {item.progress || 0}% • {item.downloadedSize || '0 MB'} / {item.totalSize || 'Calculating'}
                  </span>
                  {item.speed && (
                    <span className="text-tertiary">{item.speed}</span>
                  )}
                </div>
                <span>{item.eta || (isCompleted ? 'Finished' : isPaused ? 'Paused' : 'Ready to Start')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
          {/* Queued Action: Prominent Start Download Button */}
          {item.status === 'queued' && (
            <button
              type="button"
              onClick={() => onTogglePlayPause(item.id)}
              title="Start downloading with current settings"
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-on-primary" />
              <span>Start</span>
            </button>
          )}

          {/* Quick Download Thumbnail Button (YouTube/Visual) */}
          {isYouTube && (
            <button
              type="button"
              onClick={handleQuickDownloadThumbnail}
              title="Download High-Res Thumbnail Only"
              className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border border-[#3f3f46]/40"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Save Description & Tags Button (Strictly YouTube only) */}
          {isYouTube && (
            <button
              type="button"
              onClick={handleQuickSaveMetadata}
              title="Save Video Description & Tags (.txt)"
              className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors border border-[#3f3f46]/40"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Active / Paused Play/Pause Button */}
          {!isCompleted && item.status !== 'queued' && (
            <button
              type="button"
              onClick={() => onTogglePlayPause(item.id)}
              title={isActive ? 'Pause Download' : 'Resume Download'}
              className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors border border-[#3f3f46]/40"
            >
              {isActive ? (
                <Pause className="w-4 h-4 text-on-surface" />
              ) : (
                <Play className="w-4 h-4 text-on-surface fill-on-surface ml-0.5" />
              )}
            </button>
          )}

          {/* Configuration Inspector Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Configuration & Metadata Inspector"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
              isExpanded 
                ? 'bg-surface-container-highest text-primary border-primary/50' 
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-[#3f3f46]/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Delete Task Button */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            title="Delete Task"
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-rose-500/20 text-on-surface-variant hover:text-rose-400 flex items-center justify-center transition-colors border border-[#3f3f46]/40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Instagram Auth Banner */}
      {item.requiresInstagramAuth && (
        <div className="mx-space-lg mb-space-md p-2.5 rounded-lg bg-pink-950/30 border border-pink-500/30 flex items-center justify-between flex-wrap gap-2 text-[12px]">
          <div className="flex items-center gap-2 text-pink-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-pink-400" />
            <span>
              Instagram session required to extract and download this carousel / post.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConnectInstagram && onConnectInstagram()}
              className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-700 text-white font-medium text-[11px] transition-all shadow-sm shrink-0"
            >
              Connect Instagram
            </button>
            <button
              type="button"
              onClick={() => onRefreshMetadata && onRefreshMetadata(item.id)}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] border border-[#3f3f46]/40 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Expanded Configuration Inspector Panel */}
      {isExpanded && (
        <InspectorPanel 
          item={item} 
          onUpdateConfig={onUpdateConfig} 
          onStartDownload={onTogglePlayPause}
          instagramStatus={instagramStatus}
          onConnectInstagram={onConnectInstagram}
          onRefreshMetadata={onRefreshMetadata}
        />
      )}
    </article>
  );
}
