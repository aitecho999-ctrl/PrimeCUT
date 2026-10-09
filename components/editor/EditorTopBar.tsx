'use client';

import React from 'react';
import { AspectRatio, Project } from '@/types/project';
import { 
  Film, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Download, 
  Monitor, 
  Smartphone, 
  Square, 
  ChevronLeft,
  Check,
  Clock
} from 'lucide-react';

interface EditorTopBarProps {
  project: Project;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateAspectRatio: (ratio: AspectRatio) => void;
  onUpdateTitle: (title: string) => void;
  onOpenAutoGenerate: () => void;
  onOpenExport: () => void;
  onBackToDashboard: () => void;
  isSaved: boolean;
}

export function EditorTopBar({
  project,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onUpdateAspectRatio,
  onUpdateTitle,
  onOpenAutoGenerate,
  onOpenExport,
  onBackToDashboard,
  isSaved,
}: EditorTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState(project.title);
  const [prevProjectTitle, setPrevProjectTitle] = React.useState(project.title);

  if (project.title !== prevProjectTitle) {
    setPrevProjectTitle(project.title);
    setTempTitle(project.title);
  }

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== project.title) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(project.title);
    }
  };

  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800/80 px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand & Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBackToDashboard}
          title="Return to Projects Dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="h-4 w-px bg-neutral-800" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white hidden md:inline">
            PrimeCut <span className="text-indigo-400 font-normal">AI</span>
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        {/* Project Title Input */}
        <div className="max-w-[200px] lg:max-w-xs truncate">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(project.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-xs font-medium text-white bg-neutral-900 border border-indigo-500/50 rounded px-2 py-1 outline-none w-full"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename project"
              className="text-xs font-medium text-neutral-300 hover:text-white truncate block text-left px-2 py-1 rounded hover:bg-neutral-900 transition-colors"
            >
              {project.title}
            </button>
          )}
        </div>

        {/* Saved status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
          {isSaved ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
              <span>Saving...</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Editor Center Controls (Undo/Redo & Aspect Ratio) */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => onUpdateAspectRatio('16:9')}
            title="Landscape 16:9 (YouTube, Cinema)"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              project.aspectRatio === '16:9'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">16:9</span>
          </button>
          <button
            onClick={() => onUpdateAspectRatio('9:16')}
            title="Portrait 9:16 (Shorts, TikTok, Reels)"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              project.aspectRatio === '9:16'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">9:16</span>
          </button>
          <button
            onClick={() => onUpdateAspectRatio('1:1')}
            title="Square 1:1 (Social Feed)"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              project.aspectRatio === '1:1'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1:1</span>
          </button>
        </div>
      </div>

      {/* Zone 3: Primary Actions (AI Auto-Gen & Export) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAutoGenerate}
          title="Generate Video from Script using Gemini & Stock Search"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="whitespace-nowrap">AI Auto-Generate</span>
        </button>

        <button
          onClick={onOpenExport}
          title="Render & Export Video"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
