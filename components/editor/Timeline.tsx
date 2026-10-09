'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Project, TimelineClip, TimelineTrack } from '@/types/project';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Magnet, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Volume2,
  VolumeX,
  Maximize
} from 'lucide-react';
import { formatTimecode } from './VideoCanvasPreview';

interface TimelineProps {
  project: Project;
  currentTime: number;
  selectedClipId: string | null;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clip: TimelineClip) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
}

export function Timeline({
  project,
  currentTime,
  selectedClipId,
  onSeek,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip,
  onToggleTrackMute,
  onToggleTrackLock,
}: TimelineProps) {
  const rulerContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Zoom state: pixels per second (min 15, max 100, default 35)
  const [zoom, setZoom] = useState<number>(35);
  const [isSnapping, setIsSnapping] = useState<boolean>(true);
  const [isScrubbingRuler, setIsScrubbingRuler] = useState<boolean>(false);

  // Dragging / Trimming state
  const [draggingClip, setDraggingClip] = useState<{
    clip: TimelineClip;
    initialMouseX: number;
    initialStartTime: number;
  } | null>(null);

  const [trimmingClip, setTrimmingClip] = useState<{
    clip: TimelineClip;
    edge: 'start' | 'end';
    initialMouseX: number;
    initialStartTime: number;
    initialDuration: number;
    initialSourceIn: number;
  } | null>(null);

  // Calculate timeline max width based on project duration
  const totalDuration = Math.max(project.duration, 30);
  const timelineContentWidth = Math.max(1200, Math.ceil(totalDuration * zoom) + 300);

  // Callbacks and values refs for stable event listeners
  const onSeekRef = useRef(onSeek);
  const onUpdateClipRef = useRef(onUpdateClip);
  const projectRef = useRef(project);
  const isSnappingRef = useRef(isSnapping);
  const currentTimeRef = useRef(currentTime);
  const zoomRef = useRef(zoom);
  const onSplitClipRef = useRef(onSplitClip);
  const onDeleteClipRef = useRef(onDeleteClip);
  const onDuplicateClipRef = useRef(onDuplicateClip);
  const selectedClipRef = useRef<TimelineClip | null>(null);
  const selectedClipIdRef = useRef(selectedClipId);

  // Selected clip helper
  const selectedClip = React.useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of project.tracks) {
      const found = track.clips.find(c => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [project.tracks, selectedClipId]);

  // Synchronize refs after each render
  useEffect(() => {
    onSeekRef.current = onSeek;
    onUpdateClipRef.current = onUpdateClip;
    projectRef.current = project;
    isSnappingRef.current = isSnapping;
    currentTimeRef.current = currentTime;
    zoomRef.current = zoom;
    onSplitClipRef.current = onSplitClip;
    onDeleteClipRef.current = onDeleteClip;
    onDuplicateClipRef.current = onDuplicateClip;
    selectedClipRef.current = selectedClip;
    selectedClipIdRef.current = selectedClipId;
  });

  // Calculate snap target using refs
  const getSnapTime = React.useCallback((targetTime: number, excludeClipId?: string): number => {
    if (!isSnappingRef.current) return targetTime;
    const snapThreshold = 6 / zoomRef.current; // ~6 pixels threshold in seconds

    // Snap to playhead
    if (Math.abs(targetTime - currentTimeRef.current) < snapThreshold) {
      return currentTimeRef.current;
    }

    // Snap to other clip start/end boundaries
    for (const track of projectRef.current.tracks) {
      for (const c of track.clips) {
        if (c.id === excludeClipId) continue;
        if (Math.abs(targetTime - c.startTime) < snapThreshold) {
          return c.startTime;
        }
        if (Math.abs(targetTime - (c.startTime + c.duration)) < snapThreshold) {
          return c.startTime + c.duration;
        }
      }
    }
    return targetTime;
  }, []);

  // Click / scrub ruler to seek
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerContainerRef.current) return;
    setIsScrubbingRuler(true);
    const rect = rulerContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetTime = Math.max(0, clickX / zoom);
    onSeek(targetTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Scrubbing ruler
      if (isScrubbingRuler && rulerContainerRef.current) {
        const rect = rulerContainerRef.current.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
        const moveX = e.clientX - rect.left + scrollLeft;
        const targetTime = Math.max(0, moveX / zoomRef.current);
        onSeekRef.current(targetTime);
      }

      // 2. Dragging clip position
      if (draggingClip) {
        const deltaX = e.clientX - draggingClip.initialMouseX;
        const deltaSeconds = deltaX / zoomRef.current;
        let nextStartTime = Math.max(0, draggingClip.initialStartTime + deltaSeconds);
        nextStartTime = getSnapTime(nextStartTime, draggingClip.clip.id);

        if (nextStartTime !== draggingClip.clip.startTime) {
          onUpdateClipRef.current({
            ...draggingClip.clip,
            startTime: nextStartTime
          });
        }
      }

      // 3. Trimming clip edge
      if (trimmingClip) {
        const deltaX = e.clientX - trimmingClip.initialMouseX;
        const deltaSeconds = deltaX / zoomRef.current;

        if (trimmingClip.edge === 'end') {
          // Adjust duration
          let newDuration = Math.max(0.5, trimmingClip.initialDuration + deltaSeconds);
          const rawEndTime = trimmingClip.initialStartTime + newDuration;
          const snappedEndTime = getSnapTime(rawEndTime, trimmingClip.clip.id);
          newDuration = Math.max(0.5, snappedEndTime - trimmingClip.initialStartTime);

          onUpdateClipRef.current({
            ...trimmingClip.clip,
            duration: newDuration,
            sourceOut: trimmingClip.clip.sourceIn + newDuration
          });
        } else if (trimmingClip.edge === 'start') {
          // Adjust start time and in-point
          let newStartTime = Math.max(0, trimmingClip.initialStartTime + deltaSeconds);
          newStartTime = getSnapTime(newStartTime, trimmingClip.clip.id);
          const timeDiff = newStartTime - trimmingClip.initialStartTime;
          const newDuration = Math.max(0.5, trimmingClip.initialDuration - timeDiff);

          onUpdateClipRef.current({
            ...trimmingClip.clip,
            startTime: newStartTime,
            duration: newDuration,
            sourceIn: Math.max(0, trimmingClip.initialSourceIn + timeDiff)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbingRuler(false);
      setDraggingClip(null);
      setTrimmingClip(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbingRuler, draggingClip, trimmingClip, getSnapTime]);

  // Split clip at playhead
  const handleSplitAtPlayhead = () => {
    const sc = selectedClipRef.current;
    if (!sc) return;
    const ct = currentTimeRef.current;
    if (ct > sc.startTime && ct < sc.startTime + sc.duration) {
      onSplitClipRef.current(sc.id, ct);
    }
  };

  // Keyboard shortcut listeners (Space, S, Delete, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // ignore while typing in inputs
      }

      if (e.key === 's' || e.key === 'S') {
        const sc = selectedClipRef.current;
        if (!sc) return;
        const ct = currentTimeRef.current;
        if (ct > sc.startTime && ct < sc.startTime + sc.duration) {
          onSplitClipRef.current(sc.id, ct);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipIdRef.current) {
          onDeleteClipRef.current(selectedClipIdRef.current);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (selectedClipIdRef.current) {
          onDuplicateClipRef.current(selectedClipIdRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-64 lg:h-72 bg-neutral-950 border-t border-neutral-800 flex flex-col select-none relative z-10">
      {/* Timeline Action Toolbar */}
      <div className="h-10 bg-neutral-900/90 border-b border-neutral-800/80 px-4 flex items-center justify-between text-xs text-neutral-400">
        {/* Left: Editing Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSplitAtPlayhead}
            disabled={!selectedClip || currentTime <= selectedClip.startTime || currentTime >= selectedClip.startTime + selectedClip.duration}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-800 transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split (S)</span>
          </button>

          <button
            onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-red-900/40 hover:text-red-300 text-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Duplicate Clip (D)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Magnetic Snapping Toggle */}
          <button
            onClick={() => setIsSnapping(!isSnapping)}
            title={isSnapping ? "Magnetic Snapping Enabled" : "Magnetic Snapping Disabled"}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isSnapping ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-700/50' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Snap</span>
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(15, zoom - 5))}
            title="Zoom Out"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="15"
            max="90"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value, 10))}
            className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title={`Zoom: ${zoom}px/sec`}
          />
          <button
            onClick={() => setZoom(Math.min(90, zoom + 5))}
            title="Zoom In"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Body (Left Track Headers + Right Scrollable Track Lanes) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Fixed Track Headers */}
        <div className="w-48 lg:w-56 shrink-0 bg-neutral-950 border-r border-neutral-800/80 z-20 flex flex-col select-none">
          {/* Header corner ruler spacer */}
          <div className="h-7 bg-neutral-900/60 border-b border-neutral-800/80 px-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>TRACKS</span>
            <span>M / L</span>
          </div>

          {/* Track Headers List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-850">
            {project.tracks.map((track) => (
              <div 
                key={track.id}
                className="h-10 px-3 flex items-center justify-between hover:bg-neutral-900/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className={`w-2 h-2 rounded-full ${
                    track.type === 'video' ? 'bg-sky-400' :
                    track.type === 'overlay' ? 'bg-purple-400' :
                    track.type === 'caption' ? 'bg-amber-400' :
                    track.type === 'voiceover' ? 'bg-emerald-400' : 'bg-pink-400'
                  }`} />
                  <span className="font-medium text-neutral-300 truncate text-[11px]">
                    {track.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-neutral-400">
                  <button
                    onClick={() => onToggleTrackMute(track.id)}
                    title={track.muted ? "Unmute Track" : "Mute Track"}
                    className={`p-1 rounded hover:text-white ${track.muted ? 'text-amber-400' : ''}`}
                  >
                    {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => onToggleTrackLock(track.id)}
                    title={track.locked ? "Unlock Track" : "Lock Track"}
                    className={`p-1 rounded hover:text-white ${track.locked ? 'text-rose-400' : ''}`}
                  >
                    {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Tracks Canvas with Ruler & Playhead */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-neutral-950"
        >
          <div 
            style={{ width: `${timelineContentWidth}px` }}
            className="min-h-full relative flex flex-col"
          >
            {/* Time Ruler */}
            <div 
              ref={rulerContainerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-7 bg-neutral-900/70 border-b border-neutral-800/80 sticky top-0 z-30 cursor-pointer relative select-none"
            >
              {/* Ruler ticks and timecode markings */}
              {Array.from({ length: Math.ceil(totalDuration) + 10 }).map((_, sec) => {
                const isMajor = sec % 5 === 0;
                const leftPos = sec * zoom;
                return (
                  <div
                    key={sec}
                    style={{ left: `${leftPos}px` }}
                    className="absolute top-0 bottom-0 pointer-events-none"
                  >
                    <div className={`w-px ${isMajor ? 'h-3.5 bg-neutral-500' : 'h-1.5 bg-neutral-700'}`} />
                    {isMajor && (
                      <span className="text-[10px] text-neutral-400 font-mono pl-1 select-none">
                        {formatTimecode(sec)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Playhead Vertical Needle */}
            <div
              style={{ left: `${currentTime * zoom}px` }}
              className="absolute top-0 bottom-0 w-px bg-red-500 z-40 pointer-events-none shadow-sm"
            >
              {/* Playhead red pointer head */}
              <div className="w-3 h-3 bg-red-500 rounded-b-sm -translate-x-[5px] flex items-center justify-center shadow-md">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>

            {/* Track Lanes */}
            <div className="flex-1 flex flex-col divide-y divide-neutral-900">
              {project.tracks.map((track) => (
                <div 
                  key={track.id}
                  className="h-10 relative bg-neutral-950/40 hover:bg-neutral-900/20 transition-colors"
                >
                  {/* Subtle 5-second vertical grid lines */}
                  {Array.from({ length: Math.ceil(totalDuration / 5) + 2 }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${idx * 5 * zoom}px` }}
                      className="absolute top-0 bottom-0 w-px bg-neutral-900 pointer-events-none"
                    />
                  ))}

                  {/* Clips on this track */}
                  {track.clips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const clipWidth = Math.max(12, clip.duration * zoom);
                    const clipLeft = clip.startTime * zoom;

                    return (
                      <div
                        key={clip.id}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        onMouseDown={(e) => {
                          if (track.locked) return;
                          onSelectClip(clip.id);
                          setDraggingClip({
                            clip,
                            initialMouseX: e.clientX,
                            initialStartTime: clip.startTime,
                          });
                        }}
                        className={`absolute top-1 bottom-1 rounded flex items-center px-2 cursor-grab active:cursor-grabbing text-xs overflow-hidden transition-shadow select-none group ${
                          isSelected
                            ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-neutral-950 z-20 shadow-md'
                            : 'hover:brightness-110 z-10'
                        } ${
                          clip.type === 'video'
                            ? 'bg-sky-900/80 border border-sky-700/60 text-sky-100'
                            : clip.type === 'image'
                            ? 'bg-purple-900/80 border border-purple-700/60 text-purple-100'
                            : clip.type === 'caption' || clip.type === 'title'
                            ? 'bg-amber-900/80 border border-amber-700/60 text-amber-100'
                            : 'bg-emerald-900/80 border border-emerald-700/60 text-emerald-100'
                        }`}
                      >
                        {/* Left Trim Handle */}
                        {!track.locked && (
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onSelectClip(clip.id);
                              setTrimmingClip({
                                clip,
                                edge: 'start',
                                initialMouseX: e.clientX,
                                initialStartTime: clip.startTime,
                                initialDuration: clip.duration,
                                initialSourceIn: clip.sourceIn,
                              });
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        )}

                        {/* Thumbnail / Icon preview if available */}
                        {clip.thumbnailUrl ? (
                          <img
                            src={clip.thumbnailUrl}
                            alt=""
                            crossOrigin="anonymous"
                            className="w-6 h-6 rounded-xs object-cover mr-1.5 shrink-0 pointer-events-none opacity-80"
                          />
                        ) : null}

                        {/* Clip text title */}
                        <div className="flex-1 truncate text-[11px] font-medium leading-none pointer-events-none">
                          {clip.text || clip.name}
                        </div>

                        {/* Right Trim Handle */}
                        {!track.locked && (
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onSelectClip(clip.id);
                              setTrimmingClip({
                                clip,
                                edge: 'end',
                                initialMouseX: e.clientX,
                                initialStartTime: clip.startTime,
                                initialDuration: clip.duration,
                                initialSourceIn: clip.sourceIn,
                              });
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
