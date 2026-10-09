export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '720p' | '1080p';
export type FrameRate = 24 | 30 | 60;
export type VisualStyle = 'cinematic' | 'documentary' | 'news' | 'educational' | 'explainer';
export type MediaType = 'video' | 'photo' | 'audio';
export type FitMode = 'cover' | 'contain' | 'fill';

export interface Attribution {
  author: string;
  authorUrl?: string;
  sourceUrl: string;
  provider: 'pexels' | 'pixabay' | 'upload' | 'demo' | 'ai';
}

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'caption' | 'title';
  startTime: number; // in seconds
  duration: number; // in seconds
  sourceIn: number; // in seconds
  sourceOut: number; // in seconds
  sourceDuration: number; // in seconds
  mediaUrl: string;
  thumbnailUrl?: string;
  
  // Audio settings
  volume: number; // 0 to 1
  muted: boolean;
  fadeIn?: number;
  fadeOut?: number;
  
  // Transform & visuals
  scale?: number; // 1 = 100%
  positionX?: number; // offset percent (-50 to 50)
  positionY?: number; // offset percent (-50 to 50)
  rotation?: number; // degrees
  opacity?: number; // 0 to 1
  fitMode?: FitMode;
  
  // Color & adjustments
  brightness?: number; // 0.5 to 1.5 (default 1)
  contrast?: number; // 0.5 to 1.5 (default 1)
  saturation?: number; // 0 to 2 (default 1)
  blur?: number; // 0 to 20 px (default 0)
  
  // Text / Caption specifics
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  textBgColor?: string;
  textPosition?: 'lower-third' | 'center' | 'top' | 'headline';
  textStylePreset?: 'modern' | 'news-ticker' | 'bold-yellow' | 'cinematic' | 'classic';
  
  // Metadata & flags
  attribution?: Attribution;
  isIllustrative?: boolean;
  sceneId?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'overlay' | 'caption' | 'voiceover' | 'audio';
  muted: boolean;
  locked: boolean;
  clips: TimelineClip[];
}

export interface ResearchSource {
  title: string;
  url: string;
  publisher: string;
  date?: string;
  summary: string;
  isPrimary?: boolean;
}

export interface ResearchClaim {
  id: string;
  claim: string;
  query: string;
  verified?: boolean;
  conflicting?: boolean;
  unverified?: boolean;
  sources?: ResearchSource[];
}

export interface ScriptScene {
  id: string;
  sceneNumber: number;
  excerpt: string;
  narration: string;
  keywords: string[];
  visualDescription: string;
  mediaType: 'video' | 'photo';
  suggestedTitle: string;
  caption: string;
  estimatedDuration: number;
  isIllustrative: boolean;
  narrationStart?: number;
  narrationEnd?: number;
  researchClaims?: ResearchClaim[];
  selectedMediaUrl?: string;
  selectedThumbnailUrl?: string;
  selectedMediaType?: 'video' | 'image';
  selectedAttribution?: Attribution;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  fps: FrameRate;
  duration: number; // total calculated timeline duration
  currentTime: number; // playhead position
  tracks: TimelineTrack[];
  scenes: ScriptScene[];
  script: string;
  visualStyle: VisualStyle;
  language: string;
  targetDuration: number;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  provider: 'pexels' | 'pixabay' | 'demo' | 'upload';
  type: 'video' | 'photo' | 'audio';
  title: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  previewUrl: string;
  downloadUrl: string;
  author: string;
  authorUrl?: string;
  sourcePageUrl: string;
  isDemo?: boolean;
  tags: string[];
}

export interface ProviderStatus {
  name: string;
  providerKey: 'gemini' | 'pexels' | 'pixabay' | 'tavily' | 'news' | 'supabase';
  configured: boolean;
  isOptional: boolean;
  description: string;
  statusMessage?: string;
  latencyMs?: number;
}
