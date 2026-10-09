'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Project, TimelineClip, AspectRatio } from '@/types/project';
import { 
  Play, 
  Pause, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Grid3X3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VideoCanvasPreviewProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onUpdateProjectDuration: (duration: number) => void;
}

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

export function VideoCanvasPreview({
  project,
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlay,
  onUpdateProjectDuration,
}: VideoCanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const audioMusicRef = useRef<HTMLAudioElement>(null);
  const audioVoRef = useRef<HTMLAudioElement>(null);

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Find active clips at current time
  const v1Track = project.tracks.find(t => t.id === 'track-v1' || t.type === 'video');
  const v2Track = project.tracks.find(t => t.id === 'track-v2' || t.type === 'overlay');
  const t1Track = project.tracks.find(t => t.id === 'track-t1' || t.type === 'caption');
  const a1Track = project.tracks.find(t => t.id === 'track-a1' || t.type === 'voiceover');
  const a2Track = project.tracks.find(t => t.id === 'track-a2' || t.type === 'audio');

  const activeV1Clip = useMemo(() => {
    if (!v1Track || v1Track.muted) return null;
    return v1Track.clips.find(
      c => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) || null;
  }, [v1Track, currentTime]);

  const activeV2Clip = useMemo(() => {
    if (!v2Track || v2Track.muted) return null;
    return v2Track.clips.find(
      c => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) || null;
  }, [v2Track, currentTime]);

  const activeTextClips = useMemo(() => {
    if (!t1Track || t1Track.muted) return [];
    return t1Track.clips.filter(
      c => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    );
  }, [t1Track, currentTime]);

  const activeMusicClip = useMemo(() => {
    if (!a2Track || a2Track.muted) return null;
    return a2Track.clips.find(
      c => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) || null;
  }, [a2Track, currentTime]);

  const activeVoiceoverClip = useMemo(() => {
    if (!a1Track || a1Track.muted) return null;
    return a1Track.clips.find(
      c => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) || null;
  }, [a1Track, currentTime]);

  // Sync V1 Video playback and seek
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (activeV1Clip && activeV1Clip.type === 'video' && activeV1Clip.mediaUrl) {
      const clipElapsed = currentTime - activeV1Clip.startTime;
      const targetTime = activeV1Clip.sourceIn + clipElapsed;

      if (Math.abs(video.currentTime - targetTime) > 0.3) {
        video.currentTime = Math.max(0, targetTime);
      }

      video.playbackRate = playbackSpeed;
      video.muted = isMuted || activeV1Clip.muted;
      video.volume = isMuted ? 0 : volume * (activeV1Clip.volume ?? 1);

      if (isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }
    } else {
      if (!video.paused) video.pause();
    }
  }, [activeV1Clip, currentTime, isPlaying, playbackSpeed, isMuted, volume]);

  // Sync V2 Video playback if V2 is a video
  useEffect(() => {
    const video = overlayVideoRef.current;
    if (!video) return;

    if (activeV2Clip && activeV2Clip.type === 'video' && activeV2Clip.mediaUrl) {
      const clipElapsed = currentTime - activeV2Clip.startTime;
      const targetTime = activeV2Clip.sourceIn + clipElapsed;

      if (Math.abs(video.currentTime - targetTime) > 0.3) {
        video.currentTime = Math.max(0, targetTime);
      }

      video.playbackRate = playbackSpeed;
      video.muted = isMuted || activeV2Clip.muted;
      video.volume = isMuted ? 0 : volume * (activeV2Clip.volume ?? 1);

      if (isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }
    } else {
      if (!video.paused) video.pause();
    }
  }, [activeV2Clip, currentTime, isPlaying, playbackSpeed, isMuted, volume]);

  // Sync Background Music (A2)
  useEffect(() => {
    const audio = audioMusicRef.current;
    if (!audio) return;

    if (activeMusicClip && activeMusicClip.mediaUrl) {
      const clipElapsed = currentTime - activeMusicClip.startTime;
      const targetTime = activeMusicClip.sourceIn + clipElapsed;

      if (Math.abs(audio.currentTime - targetTime) > 0.3) {
        audio.currentTime = Math.max(0, targetTime);
      }

      audio.playbackRate = playbackSpeed;
      audio.muted = isMuted || activeMusicClip.muted;
      audio.volume = isMuted ? 0 : volume * (activeMusicClip.volume ?? 0.5);

      if (isPlaying && audio.paused) {
        audio.play().catch(() => {});
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    } else {
      if (!audio.paused) audio.pause();
    }
  }, [activeMusicClip, currentTime, isPlaying, playbackSpeed, isMuted, volume]);

  // Sync Voiceover Audio (A1)
  useEffect(() => {
    const audio = audioVoRef.current;
    if (!audio) return;

    if (activeVoiceoverClip && activeVoiceoverClip.mediaUrl) {
      const clipElapsed = currentTime - activeVoiceoverClip.startTime;
      const targetTime = activeVoiceoverClip.sourceIn + clipElapsed;

      if (Math.abs(audio.currentTime - targetTime) > 0.3) {
        audio.currentTime = Math.max(0, targetTime);
      }

      audio.playbackRate = playbackSpeed;
      audio.muted = isMuted || activeVoiceoverClip.muted;
      audio.volume = isMuted ? 0 : volume * (activeVoiceoverClip.volume ?? 1);

      if (isPlaying && audio.paused) {
        audio.play().catch(() => {});
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    } else {
      if (!audio.paused) audio.pause();
    }
  }, [activeVoiceoverClip, currentTime, isPlaying, playbackSpeed, isMuted, volume]);

  // Step frames back or forward
  const handleStep = (deltaSeconds: number) => {
    const nextTime = Math.max(0, Math.min(project.duration, currentTime + deltaSeconds));
    onSeek(nextTime);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Compute aspect ratio container styles
  const aspectClass = project.aspectRatio === '9:16'
    ? 'aspect-[9/16] max-h-full max-w-[340px]'
    : project.aspectRatio === '1:1'
    ? 'aspect-square max-h-full max-w-[480px]'
    : 'aspect-video max-h-full max-w-[820px]';

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col bg-neutral-950 border-b border-neutral-800/80 min-h-0 relative select-none"
    >
      {/* Central Screen Viewport */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-radial from-neutral-900/60 to-neutral-950">
        <div 
          className={`relative w-full ${aspectClass} bg-black shadow-2xl rounded-sm overflow-hidden flex items-center justify-center border border-neutral-800/80`}
          style={{ backgroundColor: project.backgroundColor || '#000000' }}
        >
          {/* Layer 1: V1 Main Video Clip */}
          {activeV1Clip && activeV1Clip.mediaUrl ? (
            activeV1Clip.type === 'video' ? (
              <video
                ref={mainVideoRef}
                src={activeV1Clip.mediaUrl}
                playsInline
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: activeV1Clip.fitMode || 'cover',
                  transform: `scale(${activeV1Clip.scale || 1}) translate(${activeV1Clip.positionX || 0}%, ${activeV1Clip.positionY || 0}%) rotate(${activeV1Clip.rotation || 0}deg)`,
                  filter: `brightness(${activeV1Clip.brightness || 1}) contrast(${activeV1Clip.contrast || 1}) saturate(${activeV1Clip.saturation || 1}) blur(${activeV1Clip.blur || 0}px)`,
                  opacity: activeV1Clip.opacity ?? 1,
                }}
              />
            ) : (
              <img
                src={activeV1Clip.mediaUrl}
                alt={activeV1Clip.name}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: activeV1Clip.fitMode || 'cover',
                  transform: `scale(${activeV1Clip.scale || 1}) translate(${activeV1Clip.positionX || 0}%, ${activeV1Clip.positionY || 0}%) rotate(${activeV1Clip.rotation || 0}deg)`,
                  filter: `brightness(${activeV1Clip.brightness || 1}) contrast(${activeV1Clip.contrast || 1}) saturate(${activeV1Clip.saturation || 1}) blur(${activeV1Clip.blur || 0}px)`,
                  opacity: activeV1Clip.opacity ?? 1,
                }}
              />
            )
          ) : (
            <div className="text-neutral-600 text-xs flex flex-col items-center gap-1.5 p-4 text-center">
              <span>No clip at current playhead position</span>
              <span className="text-[11px] text-neutral-700">Add media or move playhead over timeline</span>
            </div>
          )}

          {/* Layer 2: V2 Overlay / B-Roll Clip */}
          {activeV2Clip && activeV2Clip.mediaUrl && (
            activeV2Clip.type === 'video' ? (
              <video
                ref={overlayVideoRef}
                src={activeV2Clip.mediaUrl}
                playsInline
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: activeV2Clip.fitMode || 'contain',
                  transform: `scale(${activeV2Clip.scale || 0.85}) translate(${activeV2Clip.positionX || 0}%, ${activeV2Clip.positionY || 0}%) rotate(${activeV2Clip.rotation || 0}deg)`,
                  filter: `brightness(${activeV2Clip.brightness || 1}) contrast(${activeV2Clip.contrast || 1}) saturate(${activeV2Clip.saturation || 1}) blur(${activeV2Clip.blur || 0}px)`,
                  opacity: activeV2Clip.opacity ?? 0.95,
                  zIndex: 10,
                }}
              />
            ) : (
              <img
                src={activeV2Clip.mediaUrl}
                alt={activeV2Clip.name}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: activeV2Clip.fitMode || 'contain',
                  transform: `scale(${activeV2Clip.scale || 0.85}) translate(${activeV2Clip.positionX || 0}%, ${activeV2Clip.positionY || 0}%) rotate(${activeV2Clip.rotation || 0}deg)`,
                  filter: `brightness(${activeV2Clip.brightness || 1}) contrast(${activeV2Clip.contrast || 1}) saturate(${activeV2Clip.saturation || 1}) blur(${activeV2Clip.blur || 0}px)`,
                  opacity: activeV2Clip.opacity ?? 0.95,
                  zIndex: 10,
                }}
              />
            )
          )}

          {/* Layer 3: T1 Captions & Titles */}
          {activeTextClips.map((textClip) => {
            const isHeadline = textClip.textPosition === 'headline' || textClip.type === 'title';
            const isTop = textClip.textPosition === 'top';
            const posClass = isHeadline || isTop
              ? 'top-4 left-4 right-4 items-start'
              : textClip.textPosition === 'center'
              ? 'inset-0 items-center justify-center'
              : 'bottom-6 left-4 right-4 items-end';

            const presetStyle = textClip.textStylePreset || 'modern';
            let styleClasses = 'bg-neutral-950/80 text-white px-3 py-1.5 rounded text-sm font-medium tracking-normal';
            if (presetStyle === 'news-ticker') {
              styleClasses = 'bg-neutral-900 border-l-4 border-indigo-500 text-white px-3.5 py-1 text-xs uppercase font-bold tracking-wider';
            } else if (presetStyle === 'bold-yellow') {
              styleClasses = 'bg-black/90 text-yellow-300 font-extrabold px-3 py-1.5 text-base tracking-tight drop-shadow-md';
            } else if (presetStyle === 'cinematic') {
              styleClasses = 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest uppercase font-serif text-sm';
            }

            return (
              <div 
                key={textClip.id}
                className={`absolute ${posClass} flex flex-col pointer-events-none z-20 transition-all`}
              >
                <div 
                  className={styleClasses}
                  style={{
                    fontSize: textClip.fontSize ? `${textClip.fontSize}px` : undefined,
                    color: textClip.textColor || undefined,
                    backgroundColor: textClip.textBgColor || undefined,
                  }}
                >
                  {textClip.text || textClip.name}
                </div>
              </div>
            );
          })}

          {/* Broadcast Safe Area Guides (Optional Overlay) */}
          {showSafeAreas && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              {/* 90% Action Safe */}
              <div className="w-[90%] h-[90%] border border-cyan-400/30 absolute" />
              {/* 80% Title Safe */}
              <div className="w-[80%] h-[80%] border border-cyan-400/50 absolute" />
              <span className="absolute top-2 right-2 text-[10px] text-cyan-400/60 font-mono">Title Safe 80%</span>
            </div>
          )}

          {/* Hidden Audio Elements for A1 Voiceover & A2 Music */}
          {activeMusicClip?.mediaUrl ? (
            <audio
              ref={audioMusicRef}
              src={activeMusicClip.mediaUrl}
              crossOrigin="anonymous"
              className="hidden"
            />
          ) : null}
          {activeVoiceoverClip?.mediaUrl ? (
            <audio
              ref={audioVoRef}
              src={activeVoiceoverClip.mediaUrl}
              crossOrigin="anonymous"
              className="hidden"
            />
          ) : null}
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-10 bg-neutral-950/90 border-t border-neutral-800/80 px-4 flex items-center justify-between text-xs text-neutral-400 select-none">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            title="Jump to Start"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStep(-1)}
            title="Step Back 1s"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            onClick={() => handleStep(1)}
            title="Step Forward 1s"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Timecode */}
          <div className="ml-2 font-mono text-[11px] tabular-nums text-neutral-300">
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-neutral-600 mx-1">/</span>
            <span className="text-neutral-500">{formatTimecode(project.duration)}</span>
          </div>
        </div>

        {/* Right: Settings & Volume */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 rounded px-1.5 py-0.5 outline-none cursor-pointer hover:bg-neutral-850"
            title="Playback Speed"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Safe Areas Toggle */}
          <button
            onClick={() => setShowSafeAreas(!showSafeAreas)}
            title="Toggle Broadcast Safe Area Guides"
            className={`p-1 rounded transition-colors ${showSafeAreas ? 'text-indigo-400 bg-neutral-800' : 'hover:text-white'}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute" : "Mute"}
              className="p-1 hover:text-white rounded transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              className="w-14 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            className="p-1 hover:text-white rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
