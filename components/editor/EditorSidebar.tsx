'use client';

import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ScriptScene, 
  MediaItem, 
  TimelineClip, 
  VisualStyle, 
  ProviderStatus,
  ResearchClaim 
} from '@/types/project';
import { 
  FileText, 
  Search, 
  Upload, 
  Type, 
  Music, 
  Globe, 
  Settings, 
  Sparkles, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw,
  Play,
  Film,
  Download,
  ShieldCheck,
  Check
} from 'lucide-react';
import { DEMO_STOCK_MEDIA, DEMO_AUDIO_TRACKS } from '@/lib/sample-data';
import { downloadProjectJson } from '@/lib/export-service';

interface EditorSidebarProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onAddClipToTrack: (clip: Omit<TimelineClip, 'id'>) => void;
  onReplaceSelectedClipMedia?: (media: MediaItem) => void;
  selectedClipId: string | null;
}

type SidebarTab = 'script' | 'stock' | 'uploads' | 'captions' | 'audio' | 'research' | 'settings';

export function EditorSidebar({
  project,
  onUpdateProject,
  onAddClipToTrack,
  onReplaceSelectedClipMedia,
  selectedClipId,
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('script');

  // Script & AI states
  const [scriptInput, setScriptInput] = useState(project.script);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(project.visualStyle || 'cinematic');
  const [targetDuration, setTargetDuration] = useState<number>(project.targetDuration || 60);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false);
  const [scriptAnalysisError, setScriptAnalysisError] = useState<string | null>(null);

  // Stock Media Search states
  const [stockQuery, setStockQuery] = useState('space galaxy');
  const [stockProvider, setStockProvider] = useState<'all' | 'pexels' | 'pixabay'>('all');
  const [stockMediaType, setStockMediaType] = useState<'all' | 'video' | 'photo'>('all');
  const [stockResults, setStockResults] = useState<MediaItem[]>(DEMO_STOCK_MEDIA);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [isDemoStock, setIsDemoStock] = useState(true);
  const [stockPreviewModal, setStockPreviewModal] = useState<MediaItem | null>(null);

  // Uploads
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);

  // Research states
  const [isResearching, setIsResearching] = useState(false);
  const [researchQueryInput, setResearchQueryInput] = useState('');
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [researchStatusMsg, setResearchStatusMsg] = useState<string | null>(null);

  // Settings & Integrations states
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; message: string; success: boolean } | null>(null);

  // Load integration statuses on mount or tab select
  useEffect(() => {
    if (activeTab === 'settings') {
      fetch('/api/integrations/status')
        .then(res => res.json())
        .then(data => {
          if (data.providers) setProviderStatuses(data.providers);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Execute Gemini Script Breakdown
  const handleAnalyzeScript = async () => {
    if (!scriptInput.trim()) {
      setScriptAnalysisError('Please enter or paste your video script first.');
      return;
    }

    setIsAnalyzingScript(true);
    setScriptAnalysisError(null);

    try {
      const res = await fetch('/api/gemini/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptInput,
          visualStyle,
          targetDuration,
          language: project.language || 'English',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze script with Gemini.');
      }

      if (data.scenes && Array.isArray(data.scenes)) {
        onUpdateProject(prev => ({
          ...prev,
          script: scriptInput,
          visualStyle,
          targetDuration,
          scenes: data.scenes,
          duration: Math.max(prev.duration, data.estimatedDuration || targetDuration),
        }));
      }
    } catch (err: any) {
      setScriptAnalysisError(err.message || 'Error occurred while analyzing script.');
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  // Perform Stock Media Search
  const handleSearchStock = async (query = stockQuery) => {
    if (!query.trim()) return;
    setIsSearchingStock(true);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        provider: stockProvider,
        type: stockMediaType,
        orientation: project.aspectRatio === '9:16' ? 'portrait' : 'landscape',
      });

      const res = await fetch(`/api/stock/search?${params.toString()}`);
      const data = await res.json();

      if (data.results) {
        setStockResults(data.results);
        setIsDemoStock(Boolean(data.isDemoOnly));
      }
    } catch (err) {
      console.error('Stock search error:', err);
    } finally {
      setIsSearchingStock(false);
    }
  };

  // Quick search on query submit
  const handleStockFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchStock();
  };

  // Add stock media to timeline
  const handleAddMediaToTimeline = (item: MediaItem, targetTrack: 'track-v1' | 'track-v2' = 'track-v1') => {
    // Find current end of that track to place sequentially
    const track = project.tracks.find(t => t.id === targetTrack);
    const lastClip = track?.clips[track.clips.length - 1];
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;
    const clipDur = item.duration ? Math.min(15, item.duration) : 6;

    onAddClipToTrack({
      trackId: targetTrack,
      name: item.title,
      type: item.type === 'video' ? 'video' : 'image',
      startTime,
      duration: clipDur,
      sourceIn: 0,
      sourceOut: clipDur,
      sourceDuration: item.duration || clipDur,
      mediaUrl: item.previewUrl || item.downloadUrl,
      thumbnailUrl: item.thumbnailUrl,
      volume: item.type === 'video' ? 0.8 : 0,
      muted: item.type !== 'video',
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
        author: item.author,
        authorUrl: item.authorUrl,
        sourceUrl: item.sourcePageUrl,
        provider: item.provider,
      },
      isIllustrative: true,
    });
  };

  // Add caption / title preset to timeline
  const handleAddTextPreset = (preset: 'modern' | 'news-ticker' | 'bold-yellow' | 'cinematic', title: string, text: string) => {
    const tTrack = project.tracks.find(t => t.id === 'track-t1');
    const lastClip = tTrack?.clips[tTrack.clips.length - 1];
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;

    onAddClipToTrack({
      trackId: 'track-t1',
      name: title,
      type: preset === 'news-ticker' ? 'title' : 'caption',
      startTime,
      duration: 5,
      sourceIn: 0,
      sourceOut: 5,
      sourceDuration: 5,
      mediaUrl: '',
      volume: 0,
      muted: true,
      text,
      fontFamily: 'Plus Jakarta Sans',
      fontSize: preset === 'news-ticker' ? 24 : 20,
      textColor: preset === 'bold-yellow' ? '#fef08a' : '#ffffff',
      textBgColor: preset === 'bold-yellow' ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.85)',
      textPosition: preset === 'news-ticker' ? 'headline' : 'lower-third',
      textStylePreset: preset,
    });
  };

  // Research claim handler
  const handleResearchClaim = async (claimText: string) => {
    setIsResearching(true);
    setResearchStatusMsg(null);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: claimText, claim: claimText }),
      });
      const data = await res.json();
      if (data.sources) {
        setResearchResults(data.sources);
        setResearchStatusMsg(data.statusMessage || `Found ${data.sources.length} sources.`);
      }
    } catch (err: any) {
      setResearchStatusMsg('Error performing web research.');
    } finally {
      setIsResearching(false);
    }
  };

  // Test integration connection
  const handleTestIntegration = async (providerKey: string) => {
    setTestingProvider(providerKey);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerKey }),
      });
      const data = await res.json();
      setTestResult({
        provider: providerKey,
        message: data.message || 'Test finished.',
        success: Boolean(data.success),
      });
    } catch (err: any) {
      setTestResult({
        provider: providerKey,
        message: 'Connection failed.',
        success: false,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // Upload custom file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImg = file.type.startsWith('image');

      const newItem: MediaItem = {
        id: `upload-${Date.now()}-${i}`,
        provider: 'upload',
        type: isVideo ? 'video' : isAudio ? 'audio' : 'photo',
        title: file.name,
        thumbnailUrl: isImg ? url : undefined,
        previewUrl: url,
        downloadUrl: url,
        author: 'User Upload',
        sourcePageUrl: '',
        tags: ['uploaded', file.name],
      };

      setUploadedItems(prev => [newItem, ...prev]);
    }
  };

  return (
    <aside className="w-80 lg:w-96 bg-neutral-950 border-r border-neutral-800/80 flex flex-col shrink-0 min-h-0 select-none z-20">
      {/* Sidebar Navigation Tabs */}
      <div className="h-10 bg-neutral-900/60 border-b border-neutral-800/80 px-2 flex items-center justify-between overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'script' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Script</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'stock' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'uploads' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab('captions')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'captions' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'audio' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'research' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Research</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-neutral-800 text-white font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Keys</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: SCRIPT & AI */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Video Script / Narration
                </label>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {scriptInput.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={scriptInput}
                onChange={(e) => setScriptInput(e.target.value)}
                placeholder="Paste your long-form narration script here..."
                rows={6}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none font-sans"
              />
            </div>

            {/* Video Parameters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Visual Style</label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 text-xs outline-none"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="documentary">Documentary</option>
                  <option value="news">News / Journalistic</option>
                  <option value="educational">Educational</option>
                  <option value="explainer">Tech Explainer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Target Duration</label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 text-xs outline-none"
                >
                  <option value="30">30 seconds (Short)</option>
                  <option value="60">60 seconds (Standard)</option>
                  <option value="90">90 seconds (Extended)</option>
                  <option value="120">2 minutes (Deep Dive)</option>
                </select>
              </div>
            </div>

            {/* Run Gemini Breakdown Button */}
            <button
              onClick={handleAnalyzeScript}
              disabled={isAnalyzingScript || !scriptInput.trim()}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isAnalyzingScript ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini is breaking down script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Break Down into Scenes</span>
                </>
              )}
            </button>

            {scriptAnalysisError && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{scriptAnalysisError}</span>
              </div>
            )}

            {/* Generated Scenes List */}
            {project.scenes.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-200">
                    Broken Down Scenes ({project.scenes.length})
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ~{Math.round(project.duration)}s total
                  </span>
                </div>

                <div className="space-y-2.5">
                  {project.scenes.map((scene) => (
                    <div 
                      key={scene.id}
                      className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-400">
                          Scene {scene.sceneNumber}: {scene.suggestedTitle}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {scene.estimatedDuration}s
                        </span>
                      </div>

                      <p className="text-neutral-300 text-[11px] leading-relaxed">
                        {scene.narration}
                      </p>

                      <div className="text-[11px] text-neutral-400 bg-neutral-950 p-1.5 rounded border border-neutral-850">
                        <span className="text-neutral-500 font-medium">Visual: </span>
                        {scene.visualDescription}
                      </div>

                      {/* Search Keywords */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-neutral-500">Keywords:</span>
                        {scene.keywords.map((kw, ki) => (
                          <button
                            key={ki}
                            onClick={() => {
                              setStockQuery(kw);
                              setActiveTab('stock');
                              handleSearchStock(kw);
                            }}
                            title="Click to search stock library"
                            className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded transition-colors"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>

                      {/* Illustrative flag */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px]">
                        <span className="text-neutral-500">
                          {scene.isIllustrative ? 'Illustrative B-Roll' : 'Actual Event Footage'}
                        </span>
                        {scene.researchClaims && scene.researchClaims.length > 0 && (
                          <button
                            onClick={() => {
                              setResearchQueryInput(scene.researchClaims![0].claim);
                              setActiveTab('research');
                              handleResearchClaim(scene.researchClaims![0].claim);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-[11px]"
                          >
                            Fact-Check Claim ({scene.researchClaims.length})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STOCK SEARCH */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            {/* Search Input Form */}
            <form onSubmit={handleStockFormSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  placeholder="Search video clips & photography..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-indigo-500/60"
                />
                <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-2.5" />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 text-xs">
                <select
                  value={stockProvider}
                  onChange={(e) => setStockProvider(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 text-[11px] outline-none"
                >
                  <option value="all">All Providers</option>
                  <option value="pexels">Pexels</option>
                  <option value="pixabay">Pixabay</option>
                </select>

                <select
                  value={stockMediaType}
                  onChange={(e) => setStockMediaType(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 text-[11px] outline-none"
                >
                  <option value="all">All Media</option>
                  <option value="video">Videos Only</option>
                  <option value="photo">Photos Only</option>
                </select>

                <button
                  type="submit"
                  disabled={isSearchingStock}
                  className="ml-auto px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Provider notice / Demo banner */}
            {isDemoStock && (
              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">DEMO STOCK FIXTURES</span>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="text-indigo-400 hover:underline"
                  >
                    Add API Keys
                  </button>
                </div>
                <p className="text-neutral-500 leading-snug">
                  Curated HD clips loaded. Set PEXELS_API_KEY or PIXABAY_API_KEY in Settings &gt; Secrets for live queries.
                </p>
              </div>
            )}

            {/* Media Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {stockResults.map((item) => (
                <div 
                  key={item.id}
                  className="group relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col hover:border-neutral-700 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-neutral-950 relative overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                        <Film className="w-6 h-6" />
                      </div>
                    )}

                    {/* Media Type & Duration badge */}
                    <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono text-neutral-300 px-1 py-0.5 rounded">
                      {item.type === 'video' ? `${item.duration || 10}s` : 'PHOTO'}
                    </div>

                    {/* Overlay action buttons */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity p-2">
                      <button
                        onClick={() => handleAddMediaToTimeline(item, 'track-v1')}
                        title="Add to Main Video Track (V1)"
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>V1</span>
                      </button>
                      <button
                        onClick={() => handleAddMediaToTimeline(item, 'track-v2')}
                        title="Add to Overlay B-Roll Track (V2)"
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>V2</span>
                      </button>
                      <button
                        onClick={() => setStockPreviewModal(item)}
                        title="Preview Media"
                        className="p-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div className="p-1.5 flex flex-col text-[11px]">
                    <span className="text-neutral-300 font-medium truncate" title={item.title}>
                      {item.title}
                    </span>
                    <span className="text-neutral-500 text-[10px] truncate">
                      by {item.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: USER UPLOADS */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Upload Local Footage, Audio or Images
              </label>
              <input
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
              />
            </div>

            {uploadedItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                No uploads yet. Click Browse to import files from your device.
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-medium text-neutral-300 truncate">{item.title}</p>
                      <span className="text-[10px] text-neutral-500 uppercase">{item.type}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAddMediaToTimeline(item, 'track-v1')}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px]"
                      >
                        Add V1
                      </button>
                      <button
                        onClick={() => handleAddMediaToTimeline(item, 'track-v2')}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px]"
                      >
                        Add V2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CAPTIONS & TEXT */}
        {activeTab === 'captions' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300">Text & Lower-Third Presets</h4>
            
            <div className="space-y-2">
              <button
                onClick={() => handleAddTextPreset('news-ticker', 'Headline Banner', 'BREAKING: COMPUTING REVOLUTION')}
                className="w-full p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-white">Broadcast Headline Banner</div>
                <div className="text-[11px] text-neutral-400 mt-1">High-impact upper/lower ticker style</div>
              </button>

              <button
                onClick={() => handleAddTextPreset('modern', 'Modern Subtitle', 'Machine intelligence is reshaping discovery.')}
                className="w-full p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-white">Modern Clean Subtitle</div>
                <div className="text-[11px] text-neutral-400 mt-1">Dark translucent card with crisp white sans text</div>
              </button>

              <button
                onClick={() => handleAddTextPreset('bold-yellow', 'Bold Yellow Highlight', '10X BANDWIDTH DENSITY')}
                className="w-full p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-yellow-300">Bold Yellow Emphasis</div>
                <div className="text-[11px] text-neutral-400 mt-1">High-contrast punchy documentary typography</div>
              </button>

              <button
                onClick={() => handleAddTextPreset('cinematic', 'Cinematic Title Card', 'CHAPTER I: THE DEEP SKY')}
                className="w-full p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-neutral-200 font-serif tracking-wider">Cinematic Title Card</div>
                <div className="text-[11px] text-neutral-400 mt-1">Wide letter-spaced serif for narrative pacing</div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIO */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-1.5">
                Royalty-Free Audio Library
              </h4>
              <p className="text-[11px] text-neutral-500 mb-3">
                Curated ambient soundtracks and pulses licensed under Creative Commons Zero.
              </p>
            </div>

            <div className="space-y-2">
              {DEMO_AUDIO_TRACKS.map((track) => (
                <div 
                  key={track.id}
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-200">{track.title}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">{track.duration}s</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500">by {track.author}</span>
                    <button
                      onClick={() => {
                        onAddClipToTrack({
                          trackId: 'track-a2',
                          name: track.title,
                          type: 'audio',
                          startTime: 0,
                          duration: track.duration || 30,
                          sourceIn: 0,
                          sourceOut: track.duration || 30,
                          sourceDuration: track.duration || 30,
                          mediaUrl: track.previewUrl,
                          volume: 0.4,
                          muted: false,
                          fadeIn: 1,
                          fadeOut: 2,
                          attribution: {
                            author: track.author,
                            sourceUrl: track.sourcePageUrl,
                            provider: 'demo',
                          },
                        });
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium"
                    >
                      Add to Music Track (A2)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: WEB RESEARCH */}
        {activeTab === 'research' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300">Journalistic Web Research</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Grounded factual research comparing articles and official primary sources.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={researchQueryInput}
                onChange={(e) => setResearchQueryInput(e.target.value)}
                placeholder="Enter topic, statistic or claim..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 outline-none"
              />
              <button
                onClick={() => handleResearchClaim(researchQueryInput)}
                disabled={isResearching || !researchQueryInput.trim()}
                className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {isResearching ? 'Searching Web Sources...' : 'Verify Claim with Sources'}
              </button>
            </div>

            {researchStatusMsg && (
              <p className="text-[11px] text-neutral-400 font-mono bg-neutral-900 p-2 rounded border border-neutral-800">
                {researchStatusMsg}
              </p>
            )}

            {/* Research Results */}
            <div className="space-y-2 pt-2">
              {researchResults.map((src, i) => (
                <div key={i} className="p-2 bg-neutral-900 border border-neutral-800 rounded text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-neutral-200 truncate">{src.title}</span>
                    {src.isPrimary && (
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1 py-0.5 rounded shrink-0">PRIMARY</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">{src.summary}</p>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
                    <span>{src.publisher} {src.date ? `· ${src.date}` : ''}</span>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-0.5">
                      <span>Source</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & INTEGRATIONS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300">API Provider Configuration</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                All keys are kept securely on the server via AI Studio Secrets.
              </p>
            </div>

            <div className="space-y-2.5">
              {providerStatuses.map((p) => (
                <div 
                  key={p.providerKey}
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      p.configured 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {p.configured ? 'CONFIGURED' : p.isOptional ? 'OPTIONAL' : 'REQUIRED'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {p.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-neutral-500 font-mono text-[10px]">
                      {p.statusMessage}
                    </span>

                    <button
                      onClick={() => handleTestIntegration(p.providerKey)}
                      disabled={testingProvider === p.providerKey}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                    >
                      {testingProvider === p.providerKey ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {testResult && (
              <div className={`p-2 rounded text-xs ${testResult.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'}`}>
                <span className="font-semibold">{testResult.provider.toUpperCase()}: </span>
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Project Backup JSON */}
            <div className="pt-2 border-t border-neutral-800">
              <h5 className="text-xs font-semibold text-neutral-300 mb-1">Project Backup</h5>
              <button
                onClick={() => downloadProjectJson(project)}
                className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Project JSON Backup</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Media Preview Modal */}
      {stockPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm truncate">{stockPreviewModal.title}</h3>
              <button 
                onClick={() => setStockPreviewModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
              >
                Close
              </button>
            </div>

            <div className="aspect-video bg-black rounded overflow-hidden">
              {stockPreviewModal.type === 'video' ? (
                <video
                  src={stockPreviewModal.previewUrl}
                  controls
                  playsInline
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={stockPreviewModal.previewUrl}
                  alt={stockPreviewModal.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="text-xs text-neutral-400 space-y-1">
              <p>Provider: <span className="text-white uppercase">{stockPreviewModal.provider}</span></p>
              <p>Creator: <span className="text-white">{stockPreviewModal.author}</span></p>
              {stockPreviewModal.sourcePageUrl && (
                <a 
                  href={stockPreviewModal.sourcePageUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Official Source Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleAddMediaToTimeline(stockPreviewModal, 'track-v1');
                  setStockPreviewModal(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                Insert to V1 (Main)
              </button>
              <button
                onClick={() => {
                  handleAddMediaToTimeline(stockPreviewModal, 'track-v2');
                  setStockPreviewModal(null);
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold"
              >
                Insert to V2 (Overlay)
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
