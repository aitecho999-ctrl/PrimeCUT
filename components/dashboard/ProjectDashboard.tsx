'use client';

import React, { useState } from 'react';
import { Project, AspectRatio } from '@/types/project';
import { 
  Plus, 
  Film, 
  Monitor, 
  Smartphone, 
  Square, 
  Clock, 
  Trash2, 
  Copy, 
  Upload, 
  Sparkles, 
  ArrowRight,
  HardDrive,
  Calendar,
  Layers
} from 'lucide-react';
import { createEmptyProject, createSampleProject } from '@/lib/sample-data';
import { formatTimecode } from '../editor/VideoCanvasPreview';

interface ProjectDashboardProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: (project: Project) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProjectJson: (project: Project) => void;
}

export function ProjectDashboard({
  projects,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProjectJson,
}: ProjectDashboardProps) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled Project');
  const [newDesc, setNewDesc] = useState('');
  const [newAspectRatio, setNewAspectRatio] = useState<AspectRatio>('16:9');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProj = createEmptyProject(newTitle || 'Untitled Video', newAspectRatio);
    if (newDesc.trim()) newProj.description = newDesc.trim();
    onCreateProject(newProj);
    setIsNewModalOpen(false);
    setNewTitle('Untitled Project');
    setNewDesc('');
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.id && json.tracks) {
          // Give imported project a unique fresh id to avoid collisions
          const imported: Project = {
            ...json,
            id: 'proj_imported_' + Date.now().toString(36),
            title: `${json.title} (Imported)`,
            updatedAt: new Date().toISOString(),
          };
          onImportProjectJson(imported);
        } else {
          alert('Invalid PrimeCut project JSON structure.');
        }
      } catch (err) {
        alert('Failed to parse project JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col select-none">
      {/* Top Header */}
      <header className="h-16 bg-neutral-950 border-b border-neutral-800/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>PrimeCut</span>
              <span className="text-indigo-400 font-normal">AI</span>
            </h1>
            <p className="text-[11px] text-neutral-500">Long-Form AI Video Creation Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Import JSON */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium cursor-pointer border border-neutral-800 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Project JSON</span>
            <input type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
          </label>

          {/* New Project CTA */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Video Project</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Banner Notice */}
        <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">Browser-Local Storage Mode</span>
            </div>
            <p className="text-[11px] text-neutral-400 max-w-2xl leading-relaxed">
              Your projects and timeline edits are saved directly to this browser. You can export complete project JSON backups anytime from the editor top bar or re-import them across browsers.
            </p>
          </div>
          <button
            onClick={() => onCreateProject(createSampleProject())}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Template</span>
          </button>
        </div>

        {/* Projects Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">Your Video Projects ({projects.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Card Shortcut */}
            <div
              onClick={() => setIsNewModalOpen(true)}
              className="group border border-dashed border-neutral-800 hover:border-indigo-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-900 group-hover:bg-indigo-600/20 text-neutral-400 group-hover:text-indigo-400 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">Create New Video</span>
              <span className="text-[11px] text-neutral-500 mt-1">16:9, 9:16 or 1:1 timeline workspace</span>
            </div>

            {/* Saved Project Cards */}
            {projects.map((proj) => {
              const clipCount = proj.tracks.reduce((acc, t) => acc + t.clips.length, 0);
              return (
                <div
                  key={proj.id}
                  className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden flex flex-col transition-colors shadow-xs relative"
                >
                  {/* Thumbnail / Header Area */}
                  <div 
                    onClick={() => onOpenProject(proj.id)}
                    className="h-28 bg-neutral-950 p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between z-10">
                      {/* Aspect Ratio Badge */}
                      <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-neutral-300 bg-neutral-900/90 px-2 py-0.5 rounded border border-neutral-800">
                        {proj.aspectRatio === '9:16' ? <Smartphone className="w-3 h-3" /> :
                         proj.aspectRatio === '1:1' ? <Square className="w-3 h-3" /> :
                         <Monitor className="w-3 h-3" />}
                        <span>{proj.aspectRatio}</span>
                      </span>

                      {/* Duration */}
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/90 px-2 py-0.5 rounded border border-neutral-800">
                        {formatTimecode(proj.duration)}
                      </span>
                    </div>

                    <div className="z-10">
                      <span className="text-[11px] text-indigo-400 font-medium">
                        {clipCount} clips on timeline
                      </span>
                    </div>

                    {/* Subtle grid backdrop */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px]" />
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 
                        onClick={() => onOpenProject(proj.id)}
                        className="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer truncate" 
                        title={proj.title}
                      >
                        {proj.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80 text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateProject(proj.id);
                          }}
                          title="Duplicate Project"
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${proj.title}"? This cannot be undone.`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          title="Delete Project"
                          className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenProject(proj.id)}
                          className="ml-1 p-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded transition-colors"
                          title="Open Editor"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateSubmit}
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-white text-sm">Create New Video Project</h3>
              <button 
                type="button" 
                onClick={() => setIsNewModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Space Exploration Doc 2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Target audience, narrative overview..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Aspect Ratio Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '16:9', label: '16:9', desc: 'Landscape / YouTube' },
                    { id: '9:16', label: '9:16', desc: 'Portrait / Shorts' },
                    { id: '1:1', label: '1:1', desc: 'Square / Social' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewAspectRatio(item.id as AspectRatio)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        newAspectRatio === item.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs">{item.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
