'use client';

import React from 'react';
import { Project, TimelineClip, FitMode, AspectRatio, Resolution, FrameRate } from '@/types/project';
import { 
  Sliders, 
  Layers, 
  Type, 
  Volume2, 
  Maximize2, 
  Palette, 
  Clock, 
  ExternalLink,
  RotateCw,
  Sun,
  Contrast,
  Sparkles
} from 'lucide-react';
import { formatTimecode } from './VideoCanvasPreview';

interface PropertiesPanelProps {
  project: Project;
  selectedClipId: string | null;
  onUpdateClip: (clip: TimelineClip) => void;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onDeselect: () => void;
}

export function PropertiesPanel({
  project,
  selectedClipId,
  onUpdateClip,
  onUpdateProject,
  onDeselect,
}: PropertiesPanelProps) {
  // Find selected clip
  const selectedClip = React.useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of project.tracks) {
      const found = track.clips.find(c => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [project.tracks, selectedClipId]);

  if (!selectedClip) {
    // Project Settings View
    return (
      <aside className="w-72 lg:w-80 bg-neutral-950 border-l border-neutral-800/80 p-4 flex flex-col space-y-4 select-none shrink-0 overflow-y-auto z-20">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project Settings</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">GLOBAL</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Project Name</label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs outline-none focus:border-indigo-500/60"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onUpdateProject(prev => ({ ...prev, aspectRatio: ratio }))}
                  className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                    project.aspectRatio === ratio
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Resolution & Frame Rate</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={project.resolution}
                onChange={(e) => onUpdateProject(prev => ({ ...prev, resolution: e.target.value as Resolution }))}
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 text-xs outline-none"
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (Standard HD)</option>
              </select>

              <select
                value={project.fps}
                onChange={(e) => onUpdateProject(prev => ({ ...prev, fps: parseInt(e.target.value, 10) as FrameRate }))}
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 text-xs outline-none"
              >
                <option value="30">30 fps</option>
                <option value="24">24 fps (Cinema)</option>
                <option value="60">60 fps</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Canvas Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={project.backgroundColor || '#0b0d11'}
                onChange={(e) => onUpdateProject(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-8 h-8 rounded border border-neutral-700 bg-neutral-900 cursor-pointer p-0.5"
              />
              <span className="font-mono text-neutral-400 text-[11px]">{project.backgroundColor}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 space-y-1 text-[11px] text-neutral-500">
            <div className="flex justify-between">
              <span>Timeline Clips:</span>
              <span className="text-neutral-300 font-mono">
                {project.tracks.reduce((acc, t) => acc + t.clips.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Duration:</span>
              <span className="text-neutral-300 font-mono">{formatTimecode(project.duration)}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Selected Clip Inspector
  const isVideoOrImage = selectedClip.type === 'video' || selectedClip.type === 'image';
  const isText = selectedClip.type === 'caption' || selectedClip.type === 'title';
  const isAudio = selectedClip.type === 'audio';

  return (
    <aside className="w-72 lg:w-80 bg-neutral-950 border-l border-neutral-800/80 p-4 flex flex-col space-y-4 select-none shrink-0 overflow-y-auto z-20 text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="truncate max-w-[150px]">{selectedClip.name}</span>
        </div>
        <button
          onClick={onDeselect}
          className="text-[10px] text-neutral-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-900"
        >
          Deselect
        </button>
      </div>

      {/* Timing Controls */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-neutral-400 block">TIMING & DURATION</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Start Time (s)</label>
            <input
              type="number"
              step="0.1"
              value={Number(selectedClip.startTime.toFixed(2))}
              onChange={(e) => onUpdateClip({ ...selectedClip, startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-300 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Duration (s)</label>
            <input
              type="number"
              step="0.1"
              value={Number(selectedClip.duration.toFixed(2))}
              onChange={(e) => onUpdateClip({ ...selectedClip, duration: Math.max(0.5, parseFloat(e.target.value) || 1) })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-300 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Video & Image Specific Properties */}
      {isVideoOrImage && (
        <>
          {/* Transform Controls */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-850">
            <span className="text-[11px] font-semibold text-neutral-400 block">TRANSFORM & FIT</span>
            
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Scale</span>
                <span className="font-mono">{Math.round((selectedClip.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={selectedClip.scale || 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, scale: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Offset X (%)</label>
                <input
                  type="number"
                  value={selectedClip.positionX || 0}
                  onChange={(e) => onUpdateClip({ ...selectedClip, positionX: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-300 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Offset Y (%)</label>
                <input
                  type="number"
                  value={selectedClip.positionY || 0}
                  onChange={(e) => onUpdateClip({ ...selectedClip, positionY: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 block mb-1">Fit Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {(['cover', 'contain', 'fill'] as FitMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateClip({ ...selectedClip, fitMode: mode })}
                    className={`py-1 text-[11px] rounded border capitalize transition-colors ${
                      (selectedClip.fitMode || 'cover') === mode
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Grading & Filters */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-850">
            <span className="text-[11px] font-semibold text-neutral-400 block">COLOR & ADJUSTMENTS</span>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Brightness</span>
                <span className="font-mono">{selectedClip.brightness ?? 1}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={selectedClip.brightness ?? 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, brightness: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono">{selectedClip.contrast ?? 1}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={selectedClip.contrast ?? 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, contrast: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Saturation</span>
                <span className="font-mono">{selectedClip.saturation ?? 1}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={selectedClip.saturation ?? 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, saturation: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{Math.round((selectedClip.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.opacity ?? 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </>
      )}

      {/* Caption & Text Specific Properties */}
      {isText && (
        <div className="space-y-3 pt-2 border-t border-neutral-850">
          <span className="text-[11px] font-semibold text-neutral-400 block">TEXT CONTENT & STYLE</span>

          <div>
            <label className="text-[10px] text-neutral-500 block mb-1">On-Screen Text</label>
            <textarea
              rows={3}
              value={selectedClip.text || ''}
              onChange={(e) => onUpdateClip({ ...selectedClip, text: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-neutral-200 text-xs outline-none focus:border-indigo-500/60 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 block mb-1">Style Preset</label>
            <select
              value={selectedClip.textStylePreset || 'modern'}
              onChange={(e) => onUpdateClip({ ...selectedClip, textStylePreset: e.target.value as any })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 text-xs outline-none"
            >
              <option value="modern">Modern Clean Subtitle</option>
              <option value="news-ticker">Broadcast News Headline</option>
              <option value="bold-yellow">Bold Yellow Emphasis</option>
              <option value="cinematic">Cinematic Title Card</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Font Size</span>
              <span className="font-mono">{selectedClip.fontSize || 22}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="44"
              value={selectedClip.fontSize || 22}
              onChange={(e) => onUpdateClip({ ...selectedClip, fontSize: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 block mb-1">Position on Canvas</label>
            <div className="grid grid-cols-3 gap-1">
              {(['top', 'center', 'lower-third'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onUpdateClip({ ...selectedClip, textPosition: pos })}
                  className={`py-1 text-[11px] rounded border capitalize transition-colors ${
                    (selectedClip.textPosition || 'lower-third') === pos
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audio Properties */}
      {(isAudio || isVideoOrImage) && (
        <div className="space-y-2.5 pt-2 border-t border-neutral-850">
          <span className="text-[11px] font-semibold text-neutral-400 block">AUDIO SETTINGS</span>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Track Mute</span>
            <input
              type="checkbox"
              checked={selectedClip.muted}
              onChange={(e) => onUpdateClip({ ...selectedClip, muted: e.target.checked })}
              className="rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Clip Volume</span>
              <span className="font-mono">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedClip.volume ?? 1}
              onChange={(e) => onUpdateClip({ ...selectedClip, volume: parseFloat(e.target.value) })}
              className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Attribution info if present */}
      {selectedClip.attribution && (
        <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] space-y-1">
          <span className="text-neutral-500 font-medium">Attribution:</span>
          <p className="text-neutral-300 font-semibold">{selectedClip.attribution.author}</p>
          <a
            href={selectedClip.attribution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:underline flex items-center gap-1 text-[10px]"
          >
            <span>Source Page ({selectedClip.attribution.provider.toUpperCase()})</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </aside>
  );
}
