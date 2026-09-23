import React from 'react';
import { Folder, FolderOpen } from 'lucide-react';

export default function DirectorySelector({ downloadDir, onSelectDir }) {
  return (
    <div className="w-full flex items-center justify-between px-space-md py-2 bg-surface-container-low/70 rounded-lg border border-[#27272a] text-[12px]">
      <div className="flex items-center gap-space-sm min-w-0 flex-1">
        <Folder className="w-4 h-4 text-primary shrink-0" />
        <span className="text-on-surface-variant shrink-0">Save to:</span>
        <span className="font-mono text-[11px] text-on-surface truncate" title={downloadDir}>
          {downloadDir || 'Loading destination folder...'}
        </span>
      </div>

      <button
        type="button"
        onClick={onSelectDir}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-[#3f3f46]/40 text-[11px] font-medium"
      >
        <FolderOpen className="w-3.5 h-3.5 text-primary" />
        <span>Change Folder</span>
      </button>
    </div>
  );
}
