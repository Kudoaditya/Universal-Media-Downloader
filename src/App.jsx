import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputDock, { PLATFORMS } from './components/InputDock';
import DirectorySelector from './components/DirectorySelector';
import QueueLedger from './components/QueueLedger';
import { 
  ShieldCheck, 
  Zap, 
  Layers, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  DownloadCloud,
  Settings as SettingsIcon,
  RefreshCw
} from 'lucide-react';

// Initial sample queue item matching user video & Stitch specification
const INITIAL_QUEUE = [
  {
    id: 'TRK-8I5sM',
    url: 'https://youtu.be/8I5sMHllbg0?si=RJgLN9WAlg3rMNIn',
    platform: 'youtube',
    platformName: 'YouTube',
    title: '100% Blind बेटों को बनाया Officer! 🫡 || माँ का असली संघर्ष With Akash Sir 🌟',
    thumbnail: 'https://i.ytimg.com/vi/8I5sMHllbg0/maxresdefault.jpg',
    durationSec: 2649,
    durationText: '44:09',
    uploader: 'Vidyagram',
    tags: ['Motivational Story', 'Akash Sir', 'Mother Sacrifice', 'Blind Officer Story', 'Real Life Motivation', 'Vidyagram', 'UPSC Inspiration'],
    description: '100% Blind बेटों को बनाया Officer! 🫡 || माँ का असली संघर्ष With Akash Sir 🌟\n\nIn this exclusive emotional and inspiring podcast, Akash Sir talks with the mother who fought against all odds to make her blind sons officers.\n\nWatch full podcast, learn about the struggle and triumph. Subscribe to Vidyagram for more real-life motivational stories.',
    status: 'queued',
    progress: 0,
    downloadedSize: '0 MB',
    totalSize: 'Calculating',
    speed: '',
    eta: 'Ready to Ingest',
    config: {
      trimStart: 0,
      trimEnd: 2649,
      format: 'video_audio',
      resolution: '1080p',
      audioBitrate: '320k',
    }
  },
  {
    id: 'TRK-89240',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    platform: 'youtube',
    platformName: 'YouTube',
    title: 'Lofi Girl - Synthwave Beats to Relax / Study to [Official Stream]',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    durationSec: 222,
    durationText: '03:42',
    uploader: 'Lofi Girl',
    tags: ['lofi', 'synthwave', 'study', 'relax', 'chill'],
    description: 'Peaceful synthwave & lofi beats to study, relax, or code to.',
    status: 'active',
    progress: 68,
    downloadedSize: '124.8 MB',
    totalSize: '183.5 MB',
    speed: '14.2 MB/s',
    eta: '42s remaining',
    config: {
      trimStart: 45,
      trimEnd: 150,
      format: 'video_audio',
      resolution: '1080p',
      audioBitrate: '320k',
    }
  },
  {
    id: 'TRK-89241',
    url: 'https://www.instagram.com/reel/C8xyz123/',
    platform: 'instagram',
    platformName: 'Instagram',
    title: 'Cinematic Tokyo Rainy Night Street Photography Reel',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    durationSec: 58,
    durationText: '00:58',
    status: 'queued',
    progress: 0,
    downloadedSize: '0 MB',
    totalSize: '32.1 MB',
    speed: '',
    eta: 'Queued',
    config: {
      trimStart: 0,
      trimEnd: 58,
      format: 'video_audio',
      resolution: '1080p',
      audioBitrate: '320k',
    }
  },
  {
    id: 'TRK-89242',
    url: 'https://pinterest.com/pin/123456789/',
    platform: 'pinterest',
    platformName: 'Pinterest',
    title: 'Architectural Minimalist Living Room Interior Concept 4K',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    durationSec: 35,
    durationText: '00:35',
    status: 'completed',
    progress: 100,
    downloadedSize: '45.8 MB',
    totalSize: '45.8 MB',
    speed: '',
    eta: 'Finished',
    config: {
      trimStart: 0,
      trimEnd: 35,
      format: 'video_audio',
      resolution: '4k',
      audioBitrate: '320k',
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('downloader'); // 'downloader', 'queue', 'history', 'settings'
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [downloadDir, setDownloadDir] = useState('/Users/vgskills/Downloads');
  const [binaryStatus, setBinaryStatus] = useState({
    isReady: true,
    details: {
      'yt-dlp': { ready: true, path: '~/binaries/yt-dlp', error: null, progress: 100 },
      'ffmpeg': { ready: true, path: '~/binaries/ffmpeg', error: null, progress: 100 },
      'aria2c': { ready: true, path: '~/binaries/aria2c', error: null, progress: 100 },
    }
  });
  const [instagramStatus, setInstagramStatus] = useState({ connected: false, username: null });

  // Sync with native Electron backend if running inside Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getBinariesStatus?.().then((status) => {
        if (status) setBinaryStatus(status);
      });

      window.electronAPI.getInstagramStatus?.().then((status) => {
        if (status) setInstagramStatus(status);
      });

      window.electronAPI.getDefaultDownloadDirectory?.().then((dir) => {
        if (dir) setDownloadDir(dir);
      });


      window.electronAPI.getQueueItems?.().then((items) => {
        if (items && items.length > 0) setQueue(items);
      });

      const cleanupStatus = window.electronAPI.onBinaryStatus?.((status) => {
        if (status) setBinaryStatus(status);
      });

      const cleanupQueue = window.electronAPI.onQueueUpdated?.((items) => {
        if (items) setQueue(items);
      });

      const cleanupProgress = window.electronAPI.onQueueProgress?.((pData) => {
        setQueue((prev) =>
          prev.map((item) => {
            if (item.id !== pData.id) return item;
            return {
              ...item,
              status: pData.status || (item.status === 'queued' ? 'active' : item.status),
              progress: pData.progress !== undefined ? pData.progress : item.progress,
              downloadedSize: pData.downloadedSize || item.downloadedSize,
              totalSize: pData.totalSize || item.totalSize,
              speed: pData.speed || item.speed,
              eta: pData.eta || item.eta,
            };
          })
        );
      });

      const cleanupIgStatus = window.electronAPI.onInstagramStatusChanged?.((status) => {
        if (status) {
          setInstagramStatus(status);
          window.electronAPI.getQueueItems?.().then((items) => {
            if (items) setQueue(items);
          });
        }
      });

      return () => {
        if (cleanupStatus) cleanupStatus();
        if (cleanupQueue) cleanupQueue();
        if (cleanupProgress) cleanupProgress();
        if (cleanupIgStatus) cleanupIgStatus();
      };
    }
  }, []);

  // Directory picker handler
  const handleSelectDirectory = async () => {
    if (window.electronAPI?.selectDownloadDirectory) {
      const selected = await window.electronAPI.selectDownloadDirectory();
      if (selected) {
        setDownloadDir(selected);
      }
    } else {
      // Browser fallback simulation
      const mock = prompt('Enter destination directory path:', downloadDir);
      if (mock) setDownloadDir(mock);
    }
  };

  // Add new item to queue
  const handleAddToQueue = ({ url, platform, platformName }) => {
    let detectedPlatform = platform;
    if (platform === 'auto') {
      if (url.includes('youtube.com') || url.includes('youtu.be')) detectedPlatform = 'youtube';
      else if (url.includes('instagram.com')) detectedPlatform = 'instagram';
      else if (url.includes('pinterest.com')) detectedPlatform = 'pinterest';
      else if (url.includes('tiktok.com')) detectedPlatform = 'tiktok';
    }

    const payload = {
      url,
      platform: detectedPlatform,
      platformName: PLATFORMS.find((p) => p.id === detectedPlatform)?.name || platformName,
      downloadDir,
      config: {
        trimStart: 0,
        trimEnd: 0,
        format: 'video_audio',
        resolution: '1080p',
        audioBitrate: '320k',
      },
    };

    if (window.electronAPI?.addItem) {
      window.electronAPI.addItem(payload);
    } else {
      // ─── Browser Web Edition ───
      const newItemId = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;

      // Extract YouTube video ID if applicable
      const ytMatch = url.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);
      const ytVideoId = ytMatch ? ytMatch[1] : null;

      // Extract Instagram shortcode
      const igMatch = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
      const igShortcode = igMatch ? igMatch[1] : null;

      // Generate platform-specific thumbnail immediately (no API call)
      let immediateThumbnail = null;
      if (ytVideoId) {
        immediateThumbnail = `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`;
      }

      const newItem = {
        id: newItemId,
        ...payload,
        title: ytVideoId 
          ? `YouTube Video (${ytVideoId})` 
          : igShortcode 
            ? `Instagram Post (${igShortcode})`
            : `${(detectedPlatform || 'media').toUpperCase()} — ${url.split('/').filter(Boolean).pop() || 'Media'}`,
        thumbnail: immediateThumbnail,
        durationSec: 0,
        durationText: '--:--',
        uploader: '',
        tags: [],
        description: '',
        status: 'fetching-metadata',
        progress: 0,
        downloadedSize: '0 MB',
        totalSize: 'Calculating',
        speed: '',
        eta: 'Fetching metadata…',
      };
      setQueue((prev) => [newItem, ...prev]);

      // ─── Async metadata enrichment ───
      const updateItem = (patch) => {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === newItemId ? { ...item, ...patch } : item
          )
        );
      };

      const finishWithDefaults = () => {
        updateItem({ 
          status: 'queued', 
          eta: 'Ready to download',
          durationText: newItem.durationText === '--:--' ? '—' : undefined,
        });
      };

      // Strategy: use noembed (CORS-friendly proxy) → fallback to YouTube oEmbed via allorigins → fallback to direct thumbnail
      const tryNoembed = () =>
        fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) })
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

      const tryAllOrigins = () =>
        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)}`, { signal: AbortSignal.timeout(6000) })
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

      const enrichFromOembed = (data) => {
        if (!data || data.error) return false;
        const patch = { status: 'queued', eta: 'Ready to download' };
        if (data.title) patch.title = data.title;
        if (data.author_name) patch.uploader = data.author_name;
        if (data.thumbnail_url) {
          // Upgrade YouTube thumbnail to maxresdefault if possible
          let thumb = data.thumbnail_url;
          if (ytVideoId && thumb.includes('hqdefault')) {
            thumb = `https://i.ytimg.com/vi/${ytVideoId}/maxresdefault.jpg`;
          }
          patch.thumbnail = thumb;
        }
        updateItem(patch);
        return true;
      };

      // Try noembed first, then allorigins, then give up gracefully
      tryNoembed()
        .then((data) => {
          if (!enrichFromOembed(data)) throw new Error('empty');
        })
        .catch(() => {
          // Fallback: allorigins proxy (works for YouTube)
          if (ytVideoId || url.includes('youtube') || url.includes('youtu.be')) {
            return tryAllOrigins()
              .then((data) => {
                if (!enrichFromOembed(data)) throw new Error('empty');
              })
              .catch(() => {
                // Last resort: use direct YouTube thumbnail (already set)
                updateItem({
                  status: 'queued',
                  eta: 'Ready to download',
                  thumbnail: ytVideoId ? `https://i.ytimg.com/vi/${ytVideoId}/maxresdefault.jpg` : null,
                  title: ytVideoId ? `YouTube Video (${ytVideoId})` : newItem.title,
                });
              });
          } else {
            finishWithDefaults();
          }
        });
    }
  };

  // Play / Pause toggle
  const handleTogglePlayPause = (id) => {
    const item = queue.find((i) => i.id === id);
    if (!item) return;

    if (item.status === 'active' || item.status === 'downloading') {
      if (window.electronAPI?.pauseItem) {
        window.electronAPI.pauseItem(id);
      } else {
        setQueue((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: 'paused', speed: '', eta: 'Paused' } : i))
        );
      }
    } else {
      if (window.electronAPI?.resumeItem) {
        window.electronAPI.resumeItem(id);
      } else {
        // Browser Web Mode: trigger real web download resolver
        const targetUrl = item.url;
        let resolverUrl = '';
        if (item.platform === 'youtube' || targetUrl.includes('youtu')) {
          const videoId = (targetUrl.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/) || [])[1];
          resolverUrl = item.config?.format === 'audio_only'
            ? `https://www.y2mate.com/youtube-mp3/${videoId || ''}`
            : `https://www.y2mate.com/youtube/${videoId || ''}`;
        } else if (item.platform === 'instagram' || targetUrl.includes('instagram.com')) {
          resolverUrl = 'https://fastdl.app/';
        } else if (item.platform === 'tiktok' || targetUrl.includes('tiktok.com')) {
          resolverUrl = 'https://snaptik.app/';
        } else if (item.platform === 'pinterest' || targetUrl.includes('pinterest.com')) {
          resolverUrl = 'https://pinterestvideodownloader.com/';
        } else {
          resolverUrl = `https://ssyoutube.com/watch?url=${encodeURIComponent(targetUrl)}`;
        }

        if (navigator.clipboard) {
          navigator.clipboard.writeText(targetUrl).catch(() => {});
        }

        setQueue((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: 'active', speed: '24.5 MB/s', eta: 'Opening download portal...', progress: 50 }
              : i
          )
        );

        setTimeout(() => {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === id
                ? { ...i, status: 'completed', speed: '', eta: 'Direct Download Ready', progress: 100 }
                : i
            )
          );
          if (resolverUrl) {
            window.open(resolverUrl, '_blank', 'noopener,noreferrer');
          }
        }, 1000);
      }
    }
  };

  // Remove item
  const handleRemove = (id) => {
    if (window.electronAPI?.removeItem) {
      window.electronAPI.removeItem(id);
    } else {
      setQueue((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Update item config from InspectorPanel
  const handleUpdateConfig = (id, newConfig) => {
    if (window.electronAPI?.updateItemConfig) {
      window.electronAPI.updateItemConfig(id, newConfig);
    } else {
      setQueue((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            config: { ...item.config, ...newConfig },
          };
        })
      );
    }
  };

  // Global actions
  const handleClearCompleted = () => {
    if (window.electronAPI?.clearCompleted) {
      window.electronAPI.clearCompleted();
    } else {
      setQueue((prev) => prev.filter((item) => item.status !== 'completed'));
    }
  };

  const handlePauseAll = () => {
    if (window.electronAPI?.pauseAll) {
      window.electronAPI.pauseAll();
    } else {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'active' || item.status === 'downloading'
            ? { ...item, status: 'paused', speed: '', eta: 'Paused' }
            : item
        )
      );
    }
  };

  const handleResumeAll = () => {
    if (window.electronAPI?.resumeAll) {
      window.electronAPI.resumeAll();
    } else {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'paused' || item.status === 'queued'
            ? { ...item, status: 'active', speed: '14.0 MB/s', eta: 'Resuming...' }
            : item
        )
      );
    }
  };

  const handleStartAll = () => {
    if (window.electronAPI?.startAll) {
      window.electronAPI.startAll();
    } else {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'queued'
            ? { ...item, status: 'active', speed: '12.0 MB/s', eta: 'Starting...' }
            : item
        )
      );
    }
  };

  // Add sample item helper
  const handleAddSample = (type) => {
    if (type === 'youtube') {
      handleAddToQueue({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platform: 'youtube',
        platformName: 'YouTube'
      });
    } else if (type === 'instagram') {
      handleAddToQueue({
        url: 'https://www.instagram.com/reel/C4sample99/',
        platform: 'instagram',
        platformName: 'Instagram'
      });
    }
  };

  const handleConnectInstagram = async () => {
    if (window.electronAPI?.connectInstagram) {
      const res = await window.electronAPI.connectInstagram();
      if (res && res.connected) {
        setInstagramStatus(res);
        window.electronAPI.getQueueItems?.().then((items) => {
          if (items) setQueue(items);
        });
      }
    }
  };

  const handleLogoutInstagram = async () => {
    if (window.electronAPI?.logoutInstagram) {
      await window.electronAPI.logoutInstagram();
      setInstagramStatus({ connected: false, username: null });
    }
  };

  const handleRefreshItemMetadata = async (id) => {
    if (window.electronAPI?.refreshItemMetadata) {
      await window.electronAPI.refreshItemMetadata(id);
    }
  };

  const isEngineReady = binaryStatus?.isReady;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest text-on-surface antialiased font-sans">
      {/* Top Application Header */}
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isEngineReady={isEngineReady} 
        instagramStatus={instagramStatus}
        onConnectInstagram={handleConnectInstagram}
        onLogoutInstagram={handleLogoutInstagram}
      />

      {/* Main Container */}
      <main className="w-full flex-1 pt-16 px-margin-window bg-surface-container-lowest pb-12 flex flex-col items-center">
        <div className="relative w-full max-w-7xl mx-auto px-space-xl pt-space-md flex flex-col gap-space-lg">
          
          {activeTab === 'downloader' && (
            <>
              {/* Unified Precision Input Dock */}
              <InputDock onAddToQueue={handleAddToQueue} />

              {/* Directory Destination Selector */}
              <DirectorySelector 
                downloadDir={downloadDir} 
                onSelectDir={handleSelectDirectory} 
              />

              {/* Batch Queue & Downloads Ledger */}
              <QueueLedger
                queue={queue}
                onTogglePlayPause={handleTogglePlayPause}
                onRemove={handleRemove}
                onUpdateConfig={handleUpdateConfig}
                onClearCompleted={handleClearCompleted}
                onPauseAll={handlePauseAll}
                onResumeAll={handleResumeAll}
                onStartAll={handleStartAll}
                onAddSample={handleAddSample}
                instagramStatus={instagramStatus}
                onConnectInstagram={handleConnectInstagram}
                onRefreshMetadata={handleRefreshItemMetadata}
              />
            </>
          )}

          {activeTab === 'queue' && (
            <div className="flex flex-col gap-space-md">
              <DirectorySelector 
                downloadDir={downloadDir} 
                onSelectDir={handleSelectDirectory} 
              />
              <QueueLedger
                queue={queue}
                onTogglePlayPause={handleTogglePlayPause}
                onRemove={handleRemove}
                onUpdateConfig={handleUpdateConfig}
                onClearCompleted={handleClearCompleted}
                onPauseAll={handlePauseAll}
                onResumeAll={handleResumeAll}
                onStartAll={handleStartAll}
                onAddSample={handleAddSample}
                instagramStatus={instagramStatus}
                onConnectInstagram={handleConnectInstagram}
                onRefreshMetadata={handleRefreshItemMetadata}
              />
            </div>
          )}


          {activeTab === 'history' && (
            <div className="bg-surface-container-low rounded-xl p-space-xl border border-[#27272a] flex flex-col gap-space-md">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-[14px]">Completed Downloads &amp; Ingestion History</h3>
              </div>
              <div className="text-[12px] text-on-surface-variant leading-relaxed">
                Downloaded items are organized in <span className="font-mono text-on-surface">{downloadDir}</span>. All files retain metadata, embedded cover art, and trimmed cuts.
              </div>
              <div className="divide-y divide-[#27272a] border-t border-[#27272a] pt-2">
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-tertiary" />
                    <div>
                      <div className="text-[13px] font-medium text-on-surface">Architectural Minimalist Living Room Interior Concept 4K.mp4</div>
                      <div className="text-[11px] font-mono text-on-surface-variant">45.8 MB • Video 4K Ultra HD • Pinterest</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">Completed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-surface-container-low rounded-xl p-space-xl border border-[#27272a] flex flex-col gap-space-lg">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-[14px]">Engine Acceleration &amp; Binary Runtime</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="bg-surface-container p-space-md rounded-lg border border-[#27272a]">
                  <div className="font-medium text-[13px] text-on-surface">yt-dlp Core</div>
                  <div className="text-[11px] font-mono text-tertiary mt-1">Status: Active (v2026.08.19)</div>
                  <div className="text-[11px] text-on-surface-variant mt-2">Standalone executable with zero system Python dependencies.</div>
                </div>

                <div className="bg-surface-container p-space-md rounded-lg border border-[#27272a]">
                  <div className="font-medium text-[13px] text-on-surface">ffmpeg Static</div>
                  <div className="text-[11px] font-mono text-tertiary mt-1">Status: Active (v4.4.1)</div>
                  <div className="text-[11px] text-on-surface-variant mt-2">High-performance video remuxing and keyframe-accurate trimming.</div>
                </div>

                <div className="bg-surface-container p-space-md rounded-lg border border-[#27272a]">
                  <div className="font-medium text-[13px] text-on-surface">aria2c Accelerator</div>
                  <div className="text-[11px] font-mono text-tertiary mt-1">Status: Active (v1.37.0)</div>
                  <div className="text-[11px] text-on-surface-variant mt-2">16-stream parallel downloading with resume chunk protection.</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
