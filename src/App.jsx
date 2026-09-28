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

  // Sync with native Electron backend if running inside Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getBinariesStatus?.().then((status) => {
        if (status) setBinaryStatus(status);
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

      return () => {
        if (cleanupStatus) cleanupStatus();
        if (cleanupQueue) cleanupQueue();
        if (cleanupProgress) cleanupProgress();
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
    }
  };

  // Play / Pause toggle
  const handleTogglePlayPause = (id) => {
    const item = queue.find((i) => i.id === id);
    if (!item) return;

    if (item.status === 'active' || item.status === 'downloading') {
      if (window.electronAPI?.pauseItem) {
        window.electronAPI.pauseItem(id);
      }
    } else {
      if (window.electronAPI?.resumeItem) {
        window.electronAPI.resumeItem(id);
      }
    }
  };

  // Remove item
  const handleRemove = (id) => {
    if (window.electronAPI?.removeItem) {
      window.electronAPI.removeItem(id);
    }
  };

  // Update item config from InspectorPanel
  const handleUpdateConfig = (id, newConfig) => {
    if (window.electronAPI?.updateItemConfig) {
      window.electronAPI.updateItemConfig(id, newConfig);
    }
  };

  // Global actions
  const handleClearCompleted = () => {
    if (window.electronAPI?.clearCompleted) {
      window.electronAPI.clearCompleted();
    }
  };

  const handlePauseAll = () => {
    if (window.electronAPI?.pauseAll) {
      window.electronAPI.pauseAll();
    }
  };

  const handleResumeAll = () => {
    if (window.electronAPI?.resumeAll) {
      window.electronAPI.resumeAll();
    }
  };

  const handleStartAll = () => {
    if (window.electronAPI?.startAll) {
      window.electronAPI.startAll();
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
