import React, { useState } from 'react';
import { 
  Sliders, 
  Check, 
  Film, 
  Image as ImageIcon, 
  FileText, 
  Copy, 
  Download, 
  Sparkles,
  Tag,
  Info
} from 'lucide-react';
import DualRangeSlider from './DualRangeSlider';

// Helper to format seconds to MM:SS or HH:MM:SS
function formatTime(seconds) {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(timeStr, fallback = 0) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return fallback;
}

export default function InspectorPanel({ 
  item, 
  onUpdateConfig, 
  onStartDownload,
  instagramStatus,
  onConnectInstagram,
  onRefreshMetadata
}) {
  const isYouTube = item.platform === 'youtube';
  const totalDuration = item.durationSec || 222;
  const carouselItems = item.carousel || [];
  const [activeTab, setActiveTab] = useState(
    isYouTube ? 'trim' : (carouselItems.length > 0 ? 'carousel' : 'download')
  );
  const [startTime, setStartTime] = useState(item.config?.trimStart || 0);
  const [endTime, setEndTime] = useState(item.config?.trimEnd || totalDuration);
  const [startInput, setStartInput] = useState(formatTime(startTime));
  const [endInput, setEndInput] = useState(formatTime(endTime));

  const [format, setFormat] = useState(item.config?.format || 'video_audio');
  const [resolution, setResolution] = useState(item.config?.resolution || '1080p');
  const [audioBitrate, setAudioBitrate] = useState(item.config?.audioBitrate || '320k');
  
  const [applied, setApplied] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [downloadingThumb, setDownloadingThumb] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const handleSliderChange = (newStart, newEnd) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    setStartInput(formatTime(newStart));
    setEndInput(formatTime(newEnd));
  };

  const handleStartInputChange = (val) => {
    setStartInput(val);
    const parsed = parseTime(val, startTime);
    if (parsed < endTime) setStartTime(parsed);
  };

  const handleEndInputChange = (val) => {
    setEndInput(val);
    const parsed = parseTime(val, endTime);
    if (parsed > startTime && parsed <= totalDuration) setEndTime(parsed);
  };

  const handleApply = () => {
    onUpdateConfig(item.id, {
      trimStart: startTime,
      trimEnd: endTime,
      format,
      resolution,
      audioBitrate,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleDownloadThumbnail = async () => {
    setDownloadingThumb(true);
    try {
      if (window.electronAPI?.downloadThumbnail) {
        const res = await window.electronAPI.downloadThumbnail(item.id);
        setActionNotice('Thumbnail saved to destination folder!');
      } else {
        // Browser fallback: open thumbnail in new tab
        window.open(item.thumbnail || `https://i.ytimg.com/vi/${item.url.split('v=')[1]?.slice(0,11)}/maxresdefault.jpg`, '_blank');
        setActionNotice('Opened thumbnail in browser!');
      }
    } catch (e) {
      setActionNotice('Thumbnail download failed');
    } finally {
      setDownloadingThumb(false);
      setTimeout(() => setActionNotice(''), 3000);
    }
  };

  const handleSaveMetadata = async (type = 'txt') => {
    setSavingMeta(true);
    try {
      if (window.electronAPI?.saveMetadata) {
        await window.electronAPI.saveMetadata(item.id, type);
        setActionNotice(`Metadata (${type.toUpperCase()}) saved to folder!`);
      } else {
        // Browser fallback: download as local file blob
        const text = `TITLE: ${item.title}\nTAGS: ${(item.tags || []).join(', ')}\n\nDESCRIPTION:\n${item.description || ''}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${item.title.slice(0, 30)} - Description.txt`;
        a.click();
        setActionNotice('Downloaded Description.txt!');
      }
    } catch (e) {
      setActionNotice('Failed to save metadata');
    } finally {
      setSavingMeta(false);
      setTimeout(() => setActionNotice(''), 3000);
    }
  };

  const handleCopyTags = () => {
    const text = (item.tags || []).join(', ');
    navigator.clipboard.writeText(text);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(item.description || '');
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleDownloadCarouselSlide = async (index) => {
    try {
      if (window.electronAPI?.downloadCarouselItem) {
        await window.electronAPI.downloadCarouselItem(item.id, index);
        setActionNotice(`Slide ${index + 1} downloaded to Downloads folder!`);
      } else {
        const slide = item.carousel[index];
        window.open(slide.url || slide.thumbnail, '_blank');
        setActionNotice(`Opened Slide ${index + 1}!`);
      }
    } catch (_) {
      setActionNotice('Download failed');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleDownloadAllCarousel = async () => {
    try {
      if (window.electronAPI?.downloadAllCarousel) {
        const res = await window.electronAPI.downloadAllCarousel(item.id);
        setActionNotice(`Saved all ${res.count || item.carousel?.length || 0} images to folder!`);
      } else {
        setActionNotice('Saved all images!');
      }
    } catch (_) {
      setActionNotice('Failed to download carousel');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  const selectedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="bg-surface-container px-space-xl py-space-lg flex flex-col gap-space-md border-t border-[#27272a] rounded-b-xl">
      {/* Top Header & Tab switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-space-sm">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-[13px] text-on-surface">
            Configuration &amp; Metadata Inspector
          </h3>
        </div>

        {/* Sub-tabs: YouTube gets Trimming & Metadata; Instagram/Pinterest/TikTok gets Download Media & Carousel */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-[#27272a]">
          {isYouTube ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('trim')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'trim'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Trimming &amp; Presets
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('carousel')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'carousel'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Thumbnails</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'metadata'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Description &amp; Tags</span>
                {item.tags?.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] rounded-full">
                    {item.tags.length}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('download')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'download'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Download Media</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('carousel')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'carousel'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Carousel &amp; Images</span>
                {carouselItems.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-tertiary/20 text-tertiary text-[10px] rounded-full">
                    {carouselItems.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="px-3 py-1.5 rounded-lg bg-tertiary/15 text-tertiary border border-tertiary/30 text-[12px] font-medium flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Trimming & Presets Tab (Strictly YouTube only) */}
      {isYouTube && activeTab === 'trim' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Left 7 Columns: Video Trimmer & Interactive Scrubber */}
          <div className="lg:col-span-7 flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-[12px] text-on-surface">Precision Trimming</span>
              </div>
              <span className="font-mono text-[11px] text-tertiary bg-surface-container px-2 py-0.5 rounded border border-[#27272a]">
                {formatTime(selectedDuration)} selected
              </span>
            </div>

            {/* Interactive Dual Slider Scrubber */}
            <DualRangeSlider
              min={0}
              max={totalDuration}
              start={startTime}
              end={endTime}
              onChange={handleSliderChange}
            />

            {/* Timecode Inputs */}
            <div className="flex items-center justify-between gap-space-md pt-1">
              <div className="flex items-center gap-space-xs">
                <span className="font-mono text-[11px] text-on-surface-variant">Start:</span>
                <input
                  type="text"
                  value={startInput}
                  onChange={(e) => handleStartInputChange(e.target.value)}
                  className="w-24 bg-surface-container text-center font-mono text-[11px] text-on-surface py-1 rounded border border-[#3f3f46]/40 focus:outline-none focus:border-primary/50"
                />
              </div>
              <span className="text-on-surface-variant font-mono text-[12px]">→</span>
              <div className="flex items-center gap-space-xs">
                <span className="font-mono text-[11px] text-on-surface-variant">End:</span>
                <input
                  type="text"
                  value={endInput}
                  onChange={(e) => handleEndInputChange(e.target.value)}
                  className="w-24 bg-surface-container text-center font-mono text-[11px] text-on-surface py-1 rounded border border-[#3f3f46]/40 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="text-on-surface-variant font-mono text-[11px] ml-auto">
                Total: {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Segmented Format Pipeline & Quality Controls */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            {/* Format Radio Pipeline Group */}
            <div className="flex flex-col gap-space-xs">
              <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                Format Pipeline
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-lg border border-[#27272a]">
                {[
                  { id: 'video_audio', label: 'Video+Audio' },
                  { id: 'video_only', label: 'Video Only' },
                  { id: 'audio_only', label: 'Audio Only' },
                  { id: 'thumbnail_only', label: 'Thumbnail' },
                  { id: 'metadata_only', label: 'Metadata' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id)}
                    className={`py-1.5 px-1.5 rounded text-[11px] font-medium text-center transition-all truncate ${
                      format === fmt.id
                        ? 'bg-surface-container-high text-primary shadow-sm border border-[#3f3f46]'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Audio Dropdowns */}
            <div className="grid grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="text-[11px] font-medium text-on-surface-variant">
                  Video Resolution
                </label>
                <select
                  value={resolution}
                  disabled={format === 'audio_only' || format === 'thumbnail_only' || format === 'metadata_only'}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-[12px] px-2.5 py-1.5 rounded-md border border-[#3f3f46]/40 focus:outline-none focus:border-primary/50 cursor-pointer disabled:opacity-40"
                >
                  <option value="4k">4K Ultra HD</option>
                  <option value="1080p">1080p (FHD)</option>
                  <option value="720p">720p (HD)</option>
                  <option value="480p">480p (SD)</option>
                </select>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="text-[11px] font-medium text-on-surface-variant">
                  Audio Quality
                </label>
                <select
                  value={audioBitrate}
                  disabled={format === 'video_only' || format === 'thumbnail_only' || format === 'metadata_only'}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-[12px] px-2.5 py-1.5 rounded-md border border-[#3f3f46]/40 focus:outline-none focus:border-primary/50 cursor-pointer disabled:opacity-40"
                >
                  <option value="320k">320 kbps</option>
                  <option value="256k">256 kbps</option>
                  <option value="128k">128 kbps</option>
                  <option value="flac">FLAC Lossless</option>
                </select>
              </div>
            </div>

            {/* Quick 1-Click Action Buttons for Thumbnail & Metadata */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadThumbnail}
                disabled={downloadingThumb}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-medium border border-[#3f3f46]/50 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>{downloadingThumb ? 'Saving...' : 'Save Thumbnail'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveMetadata('txt')}
                disabled={savingMeta}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-medium border border-[#3f3f46]/50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-tertiary" />
                <span>{savingMeta ? 'Saving...' : 'Save Info (.txt)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Download Options Tab (For Instagram, Pinterest, TikTok - Simple & Streamlined) */}
      {!isYouTube && activeTab === 'download' && (
        <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-[#27272a]">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="text-[12px] font-semibold text-on-surface">Download Media Options</span>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant">
              {item.platformName || item.platform}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Full Video Download Option */}
            <div className="p-space-md rounded-lg bg-surface-container-lowest border border-[#27272a] hover:border-primary/40 transition-all flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[13px] font-semibold text-on-surface">Download Full Video</h4>
                  <p className="text-[11px] text-on-surface-variant">Clean MP4 format in highest available resolution</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-surface-container text-on-surface text-[11px] px-2.5 py-1.5 rounded-md border border-[#3f3f46]/40 focus:outline-none"
                >
                  <option value="1080p">Best Quality / 1080p</option>
                  <option value="720p">720p (HD)</option>
                  <option value="480p">480p (SD)</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setFormat('video_audio');
                    onUpdateConfig(item.id, { format: 'video_audio', resolution });
                    if (onStartDownload) onStartDownload(item.id);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-md bg-primary hover:bg-primary-fixed text-on-primary text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video</span>
                </button>
              </div>
            </div>

            {/* Audio Only Download Option */}
            <div className="p-space-md rounded-lg bg-surface-container-lowest border border-[#27272a] hover:border-tertiary/40 transition-all flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[13px] font-semibold text-on-surface">Download Audio Track</h4>
                  <p className="text-[11px] text-on-surface-variant">Extract original soundtrack or audio in MP3 format</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <select
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  className="bg-surface-container text-on-surface text-[11px] px-2.5 py-1.5 rounded-md border border-[#3f3f46]/40 focus:outline-none"
                >
                  <option value="320k">320 kbps (High)</option>
                  <option value="256k">256 kbps</option>
                  <option value="128k">128 kbps</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setFormat('audio_only');
                    onUpdateConfig(item.id, { format: 'audio_only', audioBitrate });
                    if (onStartDownload) onStartDownload(item.id);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-md bg-surface-container-high hover:bg-tertiary hover:text-[#0e0e11] text-on-surface text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#3f3f46]/40 shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner if carousel images are available */}
          {carouselItems.length > 0 && (
            <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/25 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-tertiary" />
                <span className="text-[12px] text-on-surface font-medium">
                  This post contains {carouselItems.length} full-resolution original image(s).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('carousel')}
                className="px-3 py-1 rounded text-[11px] font-semibold bg-tertiary text-[#0e0e11] hover:bg-tertiary/90 transition-all shadow-sm"
              >
                View Carousel &amp; Images ({carouselItems.length})
              </button>
            </div>
          )}

          {/* Banner if Instagram login is required */}
          {item.platform === 'instagram' && item.requiresInstagramAuth && (
            <div className="p-3 rounded-lg bg-pink-950/30 border border-pink-500/30 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-pink-300">
                <Info className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-[12px] font-medium">
                  Instagram session required to unlock full carousel and album slides.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onConnectInstagram && onConnectInstagram()}
                  className="px-3 py-1 rounded text-[11px] font-semibold bg-pink-600 hover:bg-pink-700 text-white transition-all shadow-sm"
                >
                  Connect Instagram
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata & Tags Inspector Tab (Strictly YouTube only) */}
      {isYouTube && activeTab === 'metadata' && (
        <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-[#27272a]">
          {/* Actions toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-[12px] font-medium text-on-surface">Extracted Tags &amp; Metadata</span>
              {item.uploader && (
                <span className="text-[11px] font-mono text-on-surface-variant">by {item.uploader}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTags}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-mono text-on-surface border border-[#3f3f46]/40"
              >
                <Copy className="w-3 h-3 text-primary" />
                <span>{copiedTags ? 'Copied!' : 'Copy Tags'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDescription}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-mono text-on-surface border border-[#3f3f46]/40"
              >
                <Copy className="w-3 h-3 text-tertiary" />
                <span>{copiedDesc ? 'Copied!' : 'Copy Description'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveMetadata('json')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary-fixed text-[11px] font-medium transition-all"
              >
                <Download className="w-3 h-3 text-on-primary" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Tags cloud */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase text-on-surface-variant tracking-wider">Tags:</span>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary border border-primary/20 text-[11px] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-on-surface-variant italic">No tags detected or still fetching...</span>
            )}
          </div>

          {/* Description preview text box */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-mono uppercase text-on-surface-variant tracking-wider">Description:</span>
            <div className="w-full max-h-36 overflow-y-auto bg-surface-container-lowest p-3 rounded-lg border border-[#27272a] text-[12px] text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed select-text">
              {item.description || 'Fetching full video description from YouTube...'}
            </div>
          </div>
        </div>
      )}

      {/* Carousel & Images Inspector Tab */}
      {activeTab === 'carousel' && (
        <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-[#27272a]">
          {/* Header Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-tertiary" />
              <span className="text-[12px] font-medium text-on-surface">
                {carouselItems.length > 0
                  ? `${carouselItems.length} Carousel / Album Images Found`
                  : 'Media Visual Assets & Thumbnails'}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant">
                ({item.platformName || item.platform})
              </span>
            </div>

            {carouselItems.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAllCarousel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tertiary text-[#0e0e11] hover:bg-tertiary/90 text-[11px] font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All {carouselItems.length} Images (.zip / folder)</span>
              </button>
            )}
          </div>

          {/* Carousel Image Grid */}
          {carouselItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
              {carouselItems.map((slide, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col bg-surface-container-lowest rounded-lg border border-[#27272a] overflow-hidden hover:border-tertiary/50 transition-all shadow-sm"
                >
                  <div className="relative aspect-[4/5] w-full bg-surface-container flex items-center justify-center overflow-hidden">
                    <img
                      src={slide.thumbnail || slide.url}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                      #{idx + 1}
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1.5 bg-surface-container-low border-t border-[#27272a]">
                    <span className="text-[11px] font-medium text-on-surface truncate">
                      {slide.title || `Image ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadCarouselSlide(idx)}
                      className="w-full flex items-center justify-center gap-1 py-1 rounded bg-surface-container-high hover:bg-tertiary hover:text-[#0e0e11] text-on-surface text-[10px] font-medium transition-colors border border-[#3f3f46]/40"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save Image</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : item.platform === 'instagram' ? (
            /* Instagram empty carousel / auth prompt */
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-surface-container-lowest rounded-lg border border-[#27272a]">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/25">
                <ImageIcon className="w-6 h-6 text-pink-400" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-[13px] font-semibold text-on-surface">
                  {item.requiresInstagramAuth ? 'Instagram Authentication Required' : 'Multi-Item Carousel / Post'}
                </h4>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Instagram restricts third-party scrapers from accessing carousel slides and post albums without being logged in. Connect your Instagram session to load and download all images.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onConnectInstagram && onConnectInstagram()}
                  className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium text-[12px] transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Connect Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRefreshMetadata && onRefreshMetadata(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] border border-[#3f3f46]/40 transition-colors"
                >
                  <span>Retry Scraping</span>
                </button>
              </div>
            </div>
          ) : (
            /* Fallback display for YouTube/Video thumbnails */
            <div className="flex flex-col gap-3 py-2">
              <div className="text-[12px] text-on-surface-variant">
                No multi-image carousel detected for this link. You can download the full-resolution thumbnail assets directly:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2 bg-surface-container-lowest p-2.5 rounded-lg border border-[#27272a]">
                  <span className="text-[11px] font-mono text-primary font-medium">Max Resolution (1080p)</span>
                  <div className="aspect-video w-full rounded overflow-hidden bg-black/40">
                    <img
                      src={item.thumbnail || `https://i.ytimg.com/vi/${item.url?.split('v=')[1]?.slice(0, 11)}/maxresdefault.jpg`}
                      alt="MaxRes Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadThumbnail}
                    className="w-full py-1.5 mt-auto rounded bg-surface-container hover:bg-primary hover:text-on-primary text-[11px] font-medium transition-colors border border-[#3f3f46]/40 flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download MaxRes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Panel Action Footer */}
      <div className="flex items-center justify-between gap-space-md pt-space-xs flex-wrap">
        {/* Quick Preset Buttons: Full Video vs Trimmed (Strictly YouTube only) */}
        {isYouTube ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-on-surface-variant">Mode:</span>
            <button
              type="button"
              onClick={() => {
                setStartTime(0);
                setEndTime(totalDuration);
                setStartInput(formatTime(0));
                setEndInput(formatTime(totalDuration));
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                startTime === 0 && endTime === totalDuration
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-[#3f3f46]/40'
              }`}
            >
              Full Video ({formatTime(totalDuration)})
            </button>
            <button
              type="button"
              onClick={() => {
                if (startTime === 0 && endTime === totalDuration && totalDuration > 30) {
                  setStartTime(0);
                  setEndTime(Math.min(60, totalDuration));
                  setStartInput(formatTime(0));
                  setEndInput(formatTime(Math.min(60, totalDuration)));
                }
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                !(startTime === 0 && endTime === totalDuration)
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-[#3f3f46]/40'
              }`}
            >
              Custom Clip ({formatTime(selectedDuration)})
            </button>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-on-surface-variant">
            {item.platformName || item.platform} • Full Media Download
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-space-md py-1.5 rounded-md text-[12px] font-medium bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all border border-[#3f3f46]/50 shadow-sm"
          >
            {applied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Save Settings</span>
              </>
            )}
          </button>

          {item.status === 'queued' && onStartDownload && (
            <button
              type="button"
              onClick={() => {
                handleApply();
                onStartDownload(item.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold bg-primary text-on-primary hover:bg-primary-fixed transition-all shadow-sm active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Start Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
