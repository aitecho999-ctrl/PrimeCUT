'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, TimelineClip, TimelineTrack, AspectRatio, ScriptScene, MediaItem } from '@/types/project';
import { createSampleProject } from '@/lib/sample-data';
import { EditorTopBar } from '@/components/editor/EditorTopBar';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { VideoCanvasPreview } from '@/components/editor/VideoCanvasPreview';
import { Timeline } from '@/components/editor/Timeline';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { ExportModal } from '@/components/editor/ExportModal';
import { AutoGenerateModal } from '@/components/editor/AutoGenerateModal';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';

const STORAGE_KEY = 'primecut_projects_v2';
const ACTIVE_PROJECT_KEY = 'primecut_active_id_v2';

export default function PrimeCutAIStudio() {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load projects from localStorage:', e);
      }
    }
    return [createSampleProject()];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (activeId) return activeId;
    }
    return 'proj_sample_breakthrough';
  });

  const [viewMode, setViewMode] = useState<'dashboard' | 'editor'>('editor');

  // Playhead & Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // Animation frame ref for continuous playback
  const animFrameRef = useRef<number | null>(null);
  const lastPlayTimeRef = useRef<number | null>(null);

  // 2. Active Project getter
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // 3. Save projects to localStorage whenever modified
  const saveProjectsToStorage = useCallback((updatedProjects: Project[]) => {
    setIsSaved(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      if (activeProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      }
      setTimeout(() => setIsSaved(true), 350);
    } catch (e) {
      console.error('Storage quota or save error:', e);
    }
  }, [activeProjectId]);

  // Push state to Undo Stack before making destructive/transformative updates
  const pushUndoState = useCallback((currentProject: Project) => {
    setUndoStack((prev) => [...prev.slice(-25), currentProject]);
    setRedoStack([]); // reset redo on fresh edit
  }, []);

  // Undo Handler
  const handleUndo = () => {
    if (undoStack.length === 0 || !activeProject) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, activeProject]);

    setProjects((prev) =>
      prev.map((p) => (p.id === previous.id ? previous : p))
    );
    saveProjectsToStorage(
      projects.map((p) => (p.id === previous.id ? previous : p))
    );
  };

  // Redo Handler
  const handleRedo = () => {
    if (redoStack.length === 0 || !activeProject) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, activeProject]);

    setProjects((prev) =>
      prev.map((p) => (p.id === next.id ? next : p))
    );
    saveProjectsToStorage(
      projects.map((p) => (p.id === next.id ? next : p))
    );
  };

  // Update active project with undo support
  const handleUpdateProject = useCallback(
    (updater: (prev: Project) => Project) => {
      if (!activeProject) return;
      pushUndoState(activeProject);

      setProjects((prevProjects) => {
        const nextProjects = prevProjects.map((p) => {
          if (p.id === activeProject.id) {
            const updated = updater(p);
            // Recalculate duration based on latest clip end
            let maxEnd = 0;
            updated.tracks.forEach((t) => {
              t.clips.forEach((c) => {
                const end = c.startTime + c.duration;
                if (end > maxEnd) maxEnd = end;
              });
            });
            updated.duration = Math.max(maxEnd, 5);
            updated.updatedAt = new Date().toISOString();
            return updated;
          }
          return p;
        });

        saveProjectsToStorage(nextProjects);
        return nextProjects;
      });
    },
    [activeProject, pushUndoState, saveProjectsToStorage]
  );

  // Playhead seeking
  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(activeProject?.duration || 60, time));
    setCurrentTime(clamped);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      lastPlayTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      // Loop back if at the end
      if (currentTime >= (activeProject?.duration || 10)) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
      lastPlayTimeRef.current = performance.now();
    }
  };

  // Continuous animation frame playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const step = (now: number) => {
      if (lastPlayTimeRef.current !== null) {
        const deltaSec = (now - lastPlayTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          const maxDur = activeProject?.duration || 60;
          if (next >= maxDur) {
            setIsPlaying(false);
            return maxDur;
          }
          return next;
        });
      }
      lastPlayTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, activeProject?.duration]);

  // Spacebar play/pause listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Timeline Clip Modifications: Add, Update, Delete, Duplicate, Split
  const handleAddClipToTrack = (newClipData: Omit<TimelineClip, 'id'>) => {
    const clipId = `clip-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newClip: TimelineClip = { ...newClipData, id: clipId };

    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === newClip.trackId ? { ...t, clips: [...t.clips, newClip] } : t
      ),
    }));

    setSelectedClipId(clipId);
  };

  const handleUpdateClip = (updatedClip: TimelineClip) => {
    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === updatedClip.trackId
          ? {
              ...t,
              clips: t.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
            }
          : t
      ),
    }));
  };

  const handleDeleteClip = (clipId: string) => {
    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
    }));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const handleDuplicateClip = (clipId: string) => {
    if (!activeProject) return;
    let clipToDupe: TimelineClip | null = null;
    let trackId = '';

    for (const t of activeProject.tracks) {
      const found = t.clips.find((c) => c.id === clipId);
      if (found) {
        clipToDupe = found;
        trackId = t.id;
        break;
      }
    }

    if (!clipToDupe) return;

    const newId = `clip-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: TimelineClip = {
      ...clipToDupe,
      id: newId,
      name: `${clipToDupe.name} (Copy)`,
      startTime: clipToDupe.startTime + clipToDupe.duration + 0.5,
    };

    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, duplicated] } : t
      ),
    }));

    setSelectedClipId(newId);
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    if (!activeProject) return;

    let original: TimelineClip | null = null;
    let trackId = '';

    for (const t of activeProject.tracks) {
      const found = t.clips.find((c) => c.id === clipId);
      if (found) {
        original = found;
        trackId = t.id;
        break;
      }
    }

    if (!original) return;
    if (splitTime <= original.startTime || splitTime >= original.startTime + original.duration) return;

    const firstPartDuration = splitTime - original.startTime;
    const secondPartDuration = original.duration - firstPartDuration;

    const part1: TimelineClip = {
      ...original,
      duration: firstPartDuration,
      sourceOut: original.sourceIn + firstPartDuration,
    };

    const part2: TimelineClip = {
      ...original,
      id: `clip-${Date.now().toString(36)}-part2`,
      name: `${original.name} (Part 2)`,
      startTime: splitTime,
      duration: secondPartDuration,
      sourceIn: original.sourceIn + firstPartDuration,
      sourceOut: original.sourceOut,
    };

    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.flatMap((c) => (c.id === clipId ? [part1, part2] : [c])),
            }
          : t
      ),
    }));

    setSelectedClipId(part2.id);
  };

  const handleToggleTrackMute = (trackId: string) => {
    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    }));
  };

  const handleToggleTrackLock = (trackId: string) => {
    handleUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, locked: !t.locked } : t
      ),
    }));
  };

  // Dashboard Actions
  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setViewMode('editor');
  };

  const handleCreateProject = (newProj: Project) => {
    const updated = [newProj, ...projects];
    setProjects(updated);
    setActiveProjectId(newProj.id);
    saveProjectsToStorage(updated);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setViewMode('editor');
  };

  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...target,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      title: `${target.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...projects];
    setProjects(updated);
    saveProjectsToStorage(updated);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjectsToStorage(updated);
    if (activeProjectId === id) {
      if (updated.length > 0) {
        setActiveProjectId(updated[0].id);
      } else {
        const sample = createSampleProject();
        setProjects([sample]);
        setActiveProjectId(sample.id);
      }
    }
  };

  const handleImportProjectJson = (imported: Project) => {
    const updated = [imported, ...projects];
    setProjects(updated);
    setActiveProjectId(imported.id);
    saveProjectsToStorage(updated);
    setViewMode('editor');
  };

  // Apply Auto-Generated Timeline
  const handleApplyGeneratedTimeline = (
    tracks: TimelineTrack[],
    scenes: ScriptScene[]
  ) => {
    handleUpdateProject((prev) => ({
      ...prev,
      tracks,
      scenes,
    }));
    setCurrentTime(0);
  };

  // If in Dashboard view, render Project Dashboard
  if (viewMode === 'dashboard' || !activeProject) {
    return (
      <ProjectDashboard
        projects={projects}
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onImportProjectJson={handleImportProjectJson}
      />
    );
  }

  // Render Full Studio Editor
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-200 select-none font-sans">
      {/* 1. Top Navigation Bar */}
      <EditorTopBar
        project={activeProject}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onUpdateAspectRatio={(ratio: AspectRatio) =>
          handleUpdateProject((prev) => ({ ...prev, aspectRatio: ratio }))
        }
        onUpdateTitle={(title: string) =>
          handleUpdateProject((prev) => ({ ...prev, title }))
        }
        onOpenAutoGenerate={() => setIsAutoGenerateOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onBackToDashboard={() => setViewMode('dashboard')}
        isSaved={isSaved}
      />

      {/* 2. Middle Row: Left Sidebar + Central Video Preview + Right Properties Panel */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Sidebar */}
        <EditorSidebar
          project={activeProject}
          onUpdateProject={handleUpdateProject}
          onAddClipToTrack={handleAddClipToTrack}
          selectedClipId={selectedClipId}
        />

        {/* Central Video Viewport */}
        <VideoCanvasPreview
          project={activeProject}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          onTogglePlay={handleTogglePlay}
          onUpdateProjectDuration={(duration) =>
            handleUpdateProject((prev) => ({ ...prev, duration }))
          }
        />

        {/* Right Properties Inspector */}
        <PropertiesPanel
          project={activeProject}
          selectedClipId={selectedClipId}
          onUpdateClip={handleUpdateClip}
          onUpdateProject={handleUpdateProject}
          onDeselect={() => setSelectedClipId(null)}
        />
      </div>

      {/* 3. Bottom Multi-Track Timeline */}
      <Timeline
        project={activeProject}
        currentTime={currentTime}
        selectedClipId={selectedClipId}
        onSeek={handleSeek}
        onSelectClip={setSelectedClipId}
        onUpdateClip={handleUpdateClip}
        onDeleteClip={handleDeleteClip}
        onDuplicateClip={handleDuplicateClip}
        onSplitClip={handleSplitClip}
        onToggleTrackMute={handleToggleTrackMute}
        onToggleTrackLock={handleToggleTrackLock}
      />

      {/* 4. Export Video Modal */}
      <ExportModal
        project={activeProject}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* 5. AI Auto-Generate Video Wizard Modal */}
      <AutoGenerateModal
        project={activeProject}
        isOpen={isAutoGenerateOpen}
        onClose={() => setIsAutoGenerateOpen(false)}
        onApplyGeneratedTimeline={handleApplyGeneratedTimeline}
      />
    </div>
  );
}
