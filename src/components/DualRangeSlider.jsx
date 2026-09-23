import React, { useRef, useCallback } from 'react';

/**
 * DualThumbSlider - Custom dual-range slider for video trimming
 * matching the Obsidian Utility Engine design system.
 */
export default function DualRangeSlider({ min = 0, max = 100, start, end, onChange }) {
  const trackRef = useRef(null);

  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min || 1)) * 100),
    [min, max]
  );

  const startPercent = getPercent(start);
  const endPercent = getPercent(end);

  const handleStartChange = (e) => {
    const value = Math.min(Number(e.target.value), end - 1);
    onChange(value, end);
  };

  const handleEndChange = (e) => {
    const value = Math.max(Number(e.target.value), start + 1);
    onChange(start, value);
  };

  return (
    <div className="relative w-full h-12 flex items-center select-none">
      {/* Background Track with Audio/Video Waveform Graphic */}
      <div 
        ref={trackRef}
        className="relative w-full h-10 bg-surface-container-lowest rounded-md overflow-hidden flex items-center px-2 border border-[#27272a]"
      >
        {/* Subtle Waveform visualization */}
        <svg
          className="w-full h-6 opacity-30 text-on-surface-variant pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 400 40"
        >
          <path
            d="M0,20 Q10,5 20,20 T40,20 T60,8 T80,32 T100,15 T120,25 T140,4 T160,35 T180,18 T200,22 T220,10 T240,30 T260,12 T280,28 T300,16 T320,24 T340,6 T360,34 T380,20 T400,20 L400,40 L0,40 Z"
            fill="currentColor"
          />
        </svg>

        {/* Selected Range Highlight Fill */}
        <div
          className="absolute top-0 bottom-0 bg-primary/25 border-y border-primary/40 pointer-events-none flex items-center justify-between"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(0, endPercent - startPercent)}%`,
          }}
        >
          {/* Subtle grid track lines */}
          <div className="w-full h-full flex justify-evenly items-center opacity-30">
            <span className="w-[1px] h-3 bg-primary" />
            <span className="w-[1px] h-5 bg-primary" />
            <span className="w-[1px] h-3 bg-primary" />
            <span className="w-[1px] h-5 bg-primary" />
            <span className="w-[1px] h-3 bg-primary" />
          </div>
        </div>
      </div>

      {/* Invisible HTML range inputs overlayed for accessible dragging */}
      <input
        type="range"
        min={min}
        max={max}
        value={start}
        onChange={handleStartChange}
        className="thumb-slider pointer-events-none absolute w-full h-10 appearance-none bg-transparent z-20"
        style={{
          zIndex: start > max - 100 ? 5 : undefined,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={end}
        onChange={handleEndChange}
        className="thumb-slider pointer-events-none absolute w-full h-10 appearance-none bg-transparent z-20"
      />
    </div>
  );
}
