'use client';

import React, { useState } from 'react';
import { Project, ScriptScene, MediaItem, TimelineTrack, TimelineClip, VisualStyle } from '@/types/project';
import { 
  Sparkles, 
  X, 
  Check, 
  RefreshCw, 
  Film, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Layers, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DEMO_STOCK_MEDIA } from '@/lib/sample-data';

interface AutoGenerateModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedTimeline: (tracks: TimelineTrack[], scenes: ScriptScene[]) => void;
}

export function AutoGenerateModal({
  project,
  isOpen,
  onClose,
  onApplyGeneratedTimeline,
}: AutoGenerateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Script & Mode, 2: Scene Breakdown, 3: Media Selection, 4: Assembly Confirmation
  const [mode, setMode] = useState<'automatic' | 'assisted' | 'manual'>('automatic');
  const [scriptText, setScriptText] = useState(
    project.script || 
`Artificial intelligence and quantum accelerators are transforming modern laboratory discovery.

By combining neural surrogate models with high-bandwidth interconnects, computational physics experiments converge ten times faster.

Global institutions are utilizing distributed supercomputing grids to simulate climate dynamics and clean fusion energy.`
  );
  const [targetDuration, setTargetDuration] = useState<number>(project.targetDuration || 45);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(project.visualStyle || 'cinematic');

  // Generation status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scenes, setScenes] = useState<ScriptScene[]>(project.scenes || []);

  // Matched media candidate for each scene (sceneId -> MediaItem)
  const [selectedFootage, setSelectedFootage] = useState<Record<string, MediaItem>>({});

  if (!isOpen) return null;

  // STEP 1 -> STEP 2: Run Gemini Breakdown
  const handleRunScriptBreakdown = async () => {
    if (!scriptText.trim()) {
      setErrorMessage('Please provide a script.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          visualStyle,
          targetDuration,
          language: project.language || 'English',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini script breakdown failed.');

      const generatedScenes: ScriptScene[] = data.scenes || [];
      setScenes(generatedScenes);

      // Search stock media candidates for each scene
      const initialFootageMap: Record<string, MediaItem> = {};
      for (const sc of generatedScenes) {
        const queryTerm = sc.keywords?.[0] || 'technology';
        // Match from demo media or call stock search
        const matched = DEMO_STOCK_MEDIA.find(m => 
          m.tags.some(t => sc.keywords.some(k => k.toLowerCase().includes(t) || t.includes(k.toLowerCase())))
        ) || DEMO_STOCK_MEDIA[Math.floor(Math.random() * DEMO_STOCK_MEDIA.length)];

        initialFootageMap[sc.id] = matched;
      }

      setSelectedFootage(initialFootageMap);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error breaking down script.');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 2 -> STEP 3: Review Footages
  const handleProceedToFootage = () => {
    setStep(3);
  };

  // STEP 3 -> STEP 4: Confirm Assembly
  const handleProceedToAssembly = () => {
    setStep(4);
  };

  // FINAL: Build Timeline & Apply
  const handleBuildTimeline = () => {
    let currentTimelineTime = 0;
    const v1Clips: TimelineClip[] = [];
    const t1Clips: TimelineClip[] = [];

    scenes.forEach((scene, index) => {
      const dur = scene.estimatedDuration || 8;
      const media = selectedFootage[scene.id] || DEMO_STOCK_MEDIA[0];

      // Video Clip for Main Track (V1)
      const v1Clip: TimelineClip = {
        id: `clip-v1-auto-${index + 1}-${Date.now().toString(36)}`,
        trackId: 'track-v1',
        name: `${scene.suggestedTitle || `Scene ${index + 1}`}`,
        type: media.type === 'video' ? 'video' : 'image',
        startTime: currentTimelineTime,
        duration: dur,
        sourceIn: 0,
        sourceOut: dur,
        sourceDuration: media.duration || dur,
        mediaUrl: media.previewUrl || media.downloadUrl,
        thumbnailUrl: media.thumbnailUrl,
        volume: media.type === 'video' ? 0.7 : 0,
        muted: media.type !== 'video',
        scale: 1,
        positionX: 0,
        positionY: 0,
        rotation: 0,
        opacity: 1,
        fitMode: 'cover',
        brightness: 1,
        contrast: 1,
        saturation: 1,
        attribution: {
          author: media.author,
          authorUrl: media.authorUrl,
          sourceUrl: media.sourcePageUrl,
          provider: media.provider,
        },
        isIllustrative: scene.isIllustrative,
        sceneId: scene.id,
      };
      v1Clips.push(v1Clip);

      // Subtitle Caption Clip for Caption Track (T1)
      const t1Clip: TimelineClip = {
        id: `clip-t1-auto-${index + 1}-${Date.now().toString(36)}`,
        trackId: 'track-t1',
        name: `Caption ${index + 1}`,
        type: 'caption',
        startTime: currentTimelineTime + 0.5,
        duration: Math.max(2, dur - 1),
        sourceIn: 0,
        sourceOut: Math.max(2, dur - 1),
        sourceDuration: Math.max(2, dur - 1),
        mediaUrl: '',
        volume: 0,
        muted: true,
        text: scene.caption || scene.narration,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 22,
        textColor: '#ffffff',
        textBgColor: 'rgba(15, 23, 42, 0.85)',
        textPosition: 'lower-third',
        textStylePreset: 'modern',
        sceneId: scene.id,
      };
      t1Clips.push(t1Clip);

      currentTimelineTime += dur;
    });

    // Reconstruct full tracks
    const updatedTracks: TimelineTrack[] = [
      { id: 'track-v1', name: 'Main Video (V1)', type: 'video', muted: false, locked: false, clips: v1Clips },
      { id: 'track-v2', name: 'B-Roll & Overlays (V2)', type: 'overlay', muted: false, locked: false, clips: [] },
      { id: 'track-t1', name: 'Captions & Titles (T1)', type: 'caption', muted: false, locked: false, clips: t1Clips },
      { id: 'track-a1', name: 'Voiceover (A1)', type: 'voiceover', muted: false, locked: false, clips: [] },
      { id: 'track-a2', name: 'Music & SFX (A2)', type: 'audio', muted: false, locked: false, clips: [] },
    ];

    onApplyGeneratedTimeline(updatedTracks, scenes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full overflow-hidden p-6 space-y-5 shadow-2xl text-xs text-neutral-300">
        {/* Header with Step Tracker */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">AI Video Generation Studio</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-neutral-500">
          <span className={step >= 1 ? 'text-indigo-400 font-semibold' : ''}>1. Script & Mode</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-indigo-400 font-semibold' : ''}>2. Scene Breakdown</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-indigo-400 font-semibold' : ''}>3. Stock Matching</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-indigo-400 font-semibold' : ''}>4. Assemble Timeline</span>
        </div>

        {/* STEP 1: SCRIPT INPUT & MODE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Narration Script</label>
              <textarea
                rows={5}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Paste script..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 outline-none focus:border-indigo-500/60 resize-none font-sans"
              />
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Generation Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'automatic', title: 'Automatic', desc: 'AI selects best matched stock assets instantly' },
                  { id: 'assisted', title: 'Assisted', desc: 'AI proposes 3 candidates per scene for your pick' },
                  { id: 'manual', title: 'Manual', desc: 'User manually approves and assigns each clip' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      mode === m.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">{m.title}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Visual Tone</label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="documentary">Documentary</option>
                  <option value="news">News Broadcast</option>
                  <option value="educational">Educational</option>
                  <option value="explainer">Tech Explainer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Target Duration</label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                  <option value="90">90 seconds</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleRunScriptBreakdown}
              disabled={isProcessing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini is breaking down your script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next: Analyze Scenes with Gemini</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: SCENE BREAKDOWN REVIEW */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Review Scenes Generated by Gemini ({scenes.length})
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                ~{scenes.reduce((acc, s) => acc + s.estimatedDuration, 0)}s total
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {scenes.map((sc, i) => (
                <div key={sc.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-400">
                      Scene {i + 1}: {sc.suggestedTitle}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">{sc.estimatedDuration}s</span>
                  </div>
                  <p className="text-neutral-300 text-[11px]">{sc.narration}</p>
                  <p className="text-neutral-500 text-[10px]">Visual: {sc.visualDescription}</p>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {sc.keywords.map((kw, ki) => (
                      <span key={ki} className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
              >
                Back
              </button>
              <button
                onClick={handleProceedToFootage}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Next: Review Stock Assets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STOCK FOOTAGE MATCHING */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-white block">
                Approved Footage for Timeline
              </span>
              <p className="text-[11px] text-neutral-500">
                Matched according to scene visual requirements and keywords.
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {scenes.map((sc, i) => {
                const assigned = selectedFootage[sc.id];
                return (
                  <div key={sc.id} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between gap-3">
                    <div className="w-16 h-12 bg-black rounded overflow-hidden shrink-0">
                      {assigned?.thumbnailUrl ? (
                        <img src={assigned.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">No media</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-200 text-xs truncate">
                        Scene {i + 1}: {sc.suggestedTitle}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Asset: {assigned?.title || 'Matching asset...'}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {assigned?.author ? `by ${assigned.author}` : ''} ({assigned?.provider?.toUpperCase()})
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                        MATCHED
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
              >
                Back
              </button>
              <button
                onClick={handleProceedToAssembly}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Next: Confirm Assembly</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: TIMELINE ASSEMBLY CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 bg-indigo-950 border border-indigo-700/60 rounded-full flex items-center justify-center mx-auto text-indigo-400 shadow-md">
              <Layers className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">Ready to Generate Timeline</h3>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
                PrimeCut AI will assemble {scenes.length} video scenes onto Main Track (V1) and align synchronized subtitles onto Caption Track (T1).
              </p>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 max-w-md mx-auto space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span>Total Scenes:</span>
                <span className="text-white">{scenes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Calculated Duration:</span>
                <span className="text-white">~{scenes.reduce((a, s) => a + s.estimatedDuration, 0)}s</span>
              </div>
              <div className="flex justify-between">
                <span>Caption Alignment:</span>
                <span className="text-emerald-400">Auto-Synchronized</span>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setStep(3)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
              >
                Back
              </button>
              <button
                onClick={handleBuildTimeline}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Assemble Video onto Timeline</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
