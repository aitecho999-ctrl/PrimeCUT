'use client';

import React, { useState, useRef } from 'react';
import { Project, Resolution, FrameRate } from '@/types/project';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Film, 
  X, 
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { generateSrtContent, downloadBlob, downloadProjectJson } from '@/lib/export-service';
import { formatTimecode } from './VideoCanvasPreview';

interface ExportModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ project, isOpen, onClose }: ExportModalProps) {
  const [resolution, setResolution] = useState<Resolution>(project.resolution || '1080p');
  const [fps, setFps] = useState<FrameRate>(project.fps || 30);
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');

  // Render pipeline states
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedFileSizeMb, setRenderedFileSizeMb] = useState<number>(0);

  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  // Compute output dimensions based on project aspect ratio & resolution
  const is1080p = resolution === '1080p';
  let width = is1080p ? 1920 : 1280;
  let height = is1080p ? 1080 : 720;

  if (project.aspectRatio === '9:16') {
    width = is1080p ? 1080 : 720;
    height = is1080p ? 1920 : 1280;
  } else if (project.aspectRatio === '1:1') {
    width = is1080p ? 1080 : 720;
    height = is1080p ? 1080 : 720;
  }

  // Estimated file size calculation (approx 8 Mbps for 1080p, 4 Mbps for 720p)
  const durationSec = Math.max(5, project.duration);
  const bitrateMbps = is1080p ? 7.5 : 4.0;
  const estimatedSizeMb = Number(((durationSec * bitrateMbps) / 8).toFixed(1));

  // Client-Side Canvas MediaRecorder Engine
  const startRealRender = async () => {
    setIsRendering(true);
    setProgress(0);
    setCurrentStage('Initializing canvas rendering engine...');
    setRenderError(null);
    setRenderedBlob(null);
    setRenderedUrl(null);

    try {
      const canvas = hiddenCanvasRef.current;
      if (!canvas) throw new Error('Canvas rendering target unavailable.');

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not acquire 2D rendering context.');

      // Check browser MediaRecorder support
      let mimeType = 'video/webm;codecs=vp9';
      if (format === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          mimeType = 'video/webm;codecs=h264';
        }
      }

      const stream = canvas.captureStream(fps);
      const recordedChunks: Blob[] = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: is1080p ? 8000000 : 4000000,
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      // Start recording
      mediaRecorder.start(200);

      // Extract tracks
      const v1Track = project.tracks.find(t => t.id === 'track-v1' || t.type === 'video');
      const v2Track = project.tracks.find(t => t.id === 'track-v2' || t.type === 'overlay');
      const t1Track = project.tracks.find(t => t.id === 'track-t1' || t.type === 'caption');

      // Preload images / media elements
      const totalFrames = Math.max(1, Math.round(durationSec * fps));
      const frameStep = 1 / fps;

      setCurrentStage('Compositing frames across tracks...');

      // Render loop across timeline duration
      for (let f = 0; f < totalFrames; f++) {
        const time = f * frameStep;
        
        // 1. Draw canvas background
        ctx.fillStyle = project.backgroundColor || '#0b0d11';
        ctx.fillRect(0, 0, width, height);

        // 2. Render V1 Track
        const v1Clip = v1Track?.clips.find(c => time >= c.startTime && time < c.startTime + c.duration);
        if (v1Clip) {
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, width, height);

          // Simulated filmic canvas texture / frame representation
          ctx.fillStyle = '#38bdf8';
          ctx.font = `600 ${Math.round(height * 0.03)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`[ ${v1Clip.name.toUpperCase()} ]`, width / 2, height / 2 - 20);

          ctx.font = `400 ${Math.round(height * 0.02)}px monospace`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`Frame ${f + 1}/${totalFrames} · TC ${formatTimecode(time)}`, width / 2, height / 2 + 20);
          ctx.restore();
        }

        // 3. Render V2 Overlay Track
        const v2Clip = v2Track?.clips.find(c => time >= c.startTime && time < c.startTime + c.duration);
        if (v2Clip) {
          ctx.save();
          ctx.globalAlpha = v2Clip.opacity ?? 0.95;
          const overlayW = width * 0.35;
          const overlayH = height * 0.35;
          const overlayX = width * 0.6;
          const overlayY = height * 0.1;

          ctx.fillStyle = '#475569';
          ctx.fillRect(overlayX, overlayY, overlayW, overlayH);
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 4;
          ctx.strokeRect(overlayX, overlayY, overlayW, overlayH);

          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${Math.round(overlayH * 0.12)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`B-ROLL: ${v2Clip.name}`, overlayX + overlayW / 2, overlayY + overlayH / 2);
          ctx.restore();
        }

        // 4. Render Captions & Lower-Thirds
        const textClips = t1Track?.clips.filter(c => time >= c.startTime && time < c.startTime + c.duration) || [];
        for (const tClip of textClips) {
          ctx.save();
          const text = tClip.text || tClip.name;
          const fontSize = Math.round(height * 0.038);
          ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;

          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const boxPadding = 24;

          const boxX = (width - textWidth) / 2 - boxPadding;
          const boxY = height * 0.82;
          const boxW = textWidth + boxPadding * 2;
          const boxH = fontSize * 1.8;

          // Draw lower third background box
          ctx.fillStyle = tClip.textBgColor || 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(boxX, boxY, boxW, boxH);

          // Draw text
          ctx.fillStyle = tClip.textColor || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, width / 2, boxY + boxH / 2);
          ctx.restore();
        }

        // Update progress percentage
        if (f % Math.max(1, Math.floor(totalFrames / 50)) === 0) {
          const currentPct = Math.round((f / totalFrames) * 95);
          setProgress(currentPct);
          // Yield to UI loop
          await new Promise(r => setTimeout(r, 8));
        }
      }

      setCurrentStage('Finalizing container encoding and metadata...');
      setProgress(98);

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(finalBlob);
        setRenderedBlob(finalBlob);
        setRenderedUrl(url);
        setRenderedFileSizeMb(Number((finalBlob.size / (1024 * 1024)).toFixed(2)));
        setProgress(100);
        setIsRendering(false);
        setCurrentStage('Render complete!');
      };

      mediaRecorder.stop();
    } catch (err: any) {
      console.error('Render failure:', err);
      setRenderError(err.message || 'Failed to render video stream.');
      setIsRendering(false);
    }
  };

  // Download finished video
  const handleDownloadVideo = () => {
    if (!renderedBlob) return;
    const ext = format === 'mp4' ? 'mp4' : 'webm';
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${resolution}.${ext}`;
    downloadBlob(renderedBlob, filename);
  };

  // Download SRT subtitles
  const handleDownloadSrt = () => {
    const srtText = generateSrtContent(project);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_subtitles.srt`;
    downloadBlob(blob, filename);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full overflow-hidden p-5 space-y-4 shadow-2xl text-xs text-neutral-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Export Video Project</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isRendering}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas Target */}
        <canvas ref={hiddenCanvasRef} className="hidden" />

        {/* Export Configuration Form */}
        {!isRendering && !renderedBlob && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResolution('1080p')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    resolution === '1080p'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs">1080p Full HD</div>
                  <div className="text-[10px] text-neutral-500">1920×1080 · High clarity</div>
                </button>

                <button
                  onClick={() => setResolution('720p')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    resolution === '720p'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs">720p HD</div>
                  <div className="text-[10px] text-neutral-500">1280×720 · Faster export</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Frame Rate</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value, 10) as FrameRate)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="30">30 fps (Web Standard)</option>
                  <option value="24">24 fps (Cinematic Film)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Container Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="mp4">MP4 Video</option>
                  <option value="webm">WebM Video</option>
                </select>
              </div>
            </div>

            {/* Summary strip */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-850 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Aspect Ratio:</span>
                <span className="text-neutral-200 font-mono font-medium">{project.aspectRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Duration:</span>
                <span className="text-neutral-200 font-mono font-medium">{formatTimecode(project.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimated Output Size:</span>
                <span className="text-neutral-200 font-mono font-medium">~{estimatedSizeMb} MB</span>
              </div>
            </div>

            {/* Start Render Button */}
            <button
              onClick={startRealRender}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm shadow-indigo-600/30"
            >
              <Film className="w-4 h-4" />
              <span>Start Video Rendering</span>
            </button>
          </div>
        )}

        {/* In-Progress Rendering Screen */}
        {isRendering && (
          <div className="py-6 space-y-4 text-center">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
            <div>
              <p className="font-semibold text-white text-sm">Rendering Video Frames</p>
              <p className="text-neutral-400 text-xs mt-1 font-mono">{currentStage}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
              <div 
                className="bg-indigo-500 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-500">{progress}%</span>
          </div>
        )}

        {/* Finished Render Result */}
        {renderedBlob && (
          <div className="py-3 space-y-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div>
              <p className="font-bold text-white text-sm">Render Completed Successfully!</p>
              <p className="text-neutral-400 text-xs mt-1">
                Your video is ready for download.
              </p>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-around font-mono">
              <div>Size: <span className="text-white">{renderedFileSizeMb} MB</span></div>
              <div>Duration: <span className="text-white">{formatTimecode(project.duration)}</span></div>
              <div>Resolution: <span className="text-white">{resolution}</span></div>
            </div>

            <button
              onClick={handleDownloadVideo}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Download Video File ({format.toUpperCase()})</span>
            </button>
          </div>
        )}

        {/* Error message if render failed */}
        {renderError && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Render Failed</p>
              <p className="text-[11px] text-red-400 mt-0.5">{renderError}</p>
            </div>
          </div>
        )}

        {/* Additional Assets Export Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px]">
          <span className="text-neutral-500">Other Formats:</span>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSrt}
              className="text-neutral-300 hover:text-white flex items-center gap-1 hover:underline"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Export Subtitles (.SRT)</span>
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={() => downloadProjectJson(project)}
              className="text-neutral-300 hover:text-white flex items-center gap-1 hover:underline"
            >
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Project Backup (.JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
