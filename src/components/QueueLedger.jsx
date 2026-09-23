import React from 'react';
import { 
  Trash2, 
  Pause, 
  Play, 
  Sparkles, 
  Film, 
  Layers,
  ArrowDownCircle
} from 'lucide-react';
import QueueItem from './QueueItem';

export default function QueueLedger({
  queue,
  onTogglePlayPause,
  onRemove,
  onUpdateConfig,
  onClearCompleted,
  onPauseAll,
  onResumeAll,
  onStartAll,
  onAddSample,
  instagramStatus,
  onConnectInstagram,
  onRefreshMetadata
}) {

  const hasCompleted = queue.some((i) => i.status === 'completed');
  const hasActive = queue.some((i) => i.status === 'active' || i.status === 'downloading');
  const queuedCount = queue.filter((i) => i.status === 'queued').length;

  return (
    <section className="w-full flex flex-col gap-space-md">
      {/* Ledger Header Controls */}
      <div className="flex items-center justify-between px-space-xs py-space-xs flex-wrap gap-2">
        <div className="flex items-center gap-space-md">
          <h2 className="font-semibold text-[15px] text-on-surface tracking-tight">
            Downloads Queue
          </h2>
          <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-[2px] rounded-full border border-[#3f3f46]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block" />
            <span className="font-mono text-[11px] text-on-surface">
              {queue.length} {queue.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-space-sm">
          {queue.length > 0 && (
            <>
              {queuedCount > 0 && (
                <button
                  type="button"
                  onClick={onStartAll}
                  className="flex items-center gap-1.5 px-space-md py-1 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed transition-all text-[12px] font-semibold shadow-sm active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-on-primary" />
                  <span>Start All ({queuedCount})</span>
                </button>
              )}

              {hasActive ? (
                <button
                  type="button"
                  onClick={onPauseAll}
                  className="flex items-center gap-1.5 px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors text-[12px] font-medium border border-[#3f3f46]/40"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause All</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResumeAll}
                  className="flex items-center gap-1.5 px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors text-[12px] font-medium border border-[#3f3f46]/40"
                >
                  <Play className="w-3.5 h-3.5 text-primary" />
                  <span>Resume All</span>
                </button>
              )}

              {hasCompleted && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="flex items-center gap-1.5 px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors text-[12px] font-medium border border-[#3f3f46]/40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Clear Completed</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Queue Items List */}
      {queue.length > 0 ? (
        <div className="flex flex-col gap-space-md">
          {queue.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              onTogglePlayPause={onTogglePlayPause}
              onRemove={onRemove}
              onUpdateConfig={onUpdateConfig}
              instagramStatus={instagramStatus}
              onConnectInstagram={onConnectInstagram}
              onRefreshMetadata={onRefreshMetadata}
            />
          ))}

        </div>
      ) : (
        /* Empty State */
        <div className="w-full py-16 px-space-xl rounded-xl bg-surface-container-low/60 border border-[#27272a] border-dashed flex flex-col items-center justify-center text-center gap-space-md">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-[#3f3f46]/40 shadow-inner">
            <ArrowDownCircle className="w-6 h-6 text-primary" />
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-[14px] font-semibold text-on-surface">
              Queue is currently empty
            </h3>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Paste video URLs from YouTube, Instagram Reels, TikTok, or Pinterest above to begin batch ingestion.
            </p>
          </div>

          {/* Quick sample insertion for demo & testing */}
          <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => onAddSample('youtube')}
              className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-medium text-on-surface border border-[#3f3f46]/40 flex items-center gap-1.5 transition-colors"
            >
              <Film className="w-3 h-3 text-rose-500" />
              <span>Load Sample YouTube Video</span>
            </button>
            <button
              type="button"
              onClick={() => onAddSample('instagram')}
              className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-medium text-on-surface border border-[#3f3f46]/40 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3 h-3 text-pink-400" />
              <span>Load Sample Instagram Reel</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
