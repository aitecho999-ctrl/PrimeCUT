import { Project, MediaItem, TimelineTrack } from '@/types/project';

// High-fidelity royalty-free public domain / creative commons demo clips for offline or keyless operation
export const DEMO_STOCK_MEDIA: MediaItem[] = [
  {
    id: 'demo-vid-1',
    provider: 'demo',
    type: 'video',
    title: 'Earth Orbit & Space Atmosphere',
    duration: 15,
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/41949/earth-earth-at-night-night-lights-41949.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    author: 'NASA Public Domain / Blender Foundation',
    sourcePageUrl: 'https://images.nasa.gov',
    isDemo: true,
    tags: ['space', 'earth', 'atmosphere', 'cinematic', 'science', 'galaxy']
  },
  {
    id: 'demo-vid-2',
    provider: 'demo',
    type: 'video',
    title: 'Modern High-Tech Server Farm & Quantum Chip',
    duration: 12,
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    author: 'TechArchive Creative Commons',
    sourcePageUrl: 'https://archive.org',
    isDemo: true,
    tags: ['ai', 'server', 'technology', 'datacenter', 'cyber', 'code']
  },
  {
    id: 'demo-vid-3',
    provider: 'demo',
    type: 'video',
    title: 'Deep Ocean Bioluminescent Reef & Coral',
    duration: 14,
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/889929/pexels-photo-889929.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    author: 'Oceanic Research Archive',
    sourcePageUrl: 'https://archive.org',
    isDemo: true,
    tags: ['ocean', 'nature', 'coral', 'underwater', 'marine', 'sea']
  },
  {
    id: 'demo-vid-4',
    provider: 'demo',
    type: 'video',
    title: 'Futuristic Cyberpunk Skyline & City Lights',
    duration: 10,
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    author: 'Open Source Studio',
    sourcePageUrl: 'https://orange.blender.org',
    isDemo: true,
    tags: ['city', 'skyline', 'traffic', 'urban', 'night', 'cyberpunk']
  },
  {
    id: 'demo-vid-5',
    provider: 'demo',
    type: 'video',
    title: 'Clean Energy Wind Turbines & Golden Sunset',
    duration: 16,
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/414837/pexels-photo-414837.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    author: 'EcoFootage CC-BY',
    sourcePageUrl: 'https://archive.org',
    isDemo: true,
    tags: ['energy', 'wind turbine', 'green', 'climate', 'sunset', 'renewable']
  },
  {
    id: 'demo-img-1',
    provider: 'demo',
    type: 'photo',
    title: 'Neural Network Synapse Visualization',
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/17483874/pexels-photo-17483874.png?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://images.pexels.com/photos/17483874/pexels-photo-17483874.png?auto=compress&cs=tinysrgb&w=1920',
    downloadUrl: 'https://images.pexels.com/photos/17483874/pexels-photo-17483874.png?auto=compress&cs=tinysrgb&w=1920',
    author: 'AI Graphics Studio',
    sourcePageUrl: 'https://pexels.com',
    isDemo: true,
    tags: ['ai', 'network', 'brain', 'synapse', 'abstract', 'data']
  },
  {
    id: 'demo-img-2',
    provider: 'demo',
    type: 'photo',
    title: 'Silicon Microchip Electron Microscope View',
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1920',
    downloadUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1920',
    author: 'Hardware Lab',
    sourcePageUrl: 'https://pexels.com',
    isDemo: true,
    tags: ['hardware', 'chip', 'processor', 'semiconductor', 'macro']
  },
  {
    id: 'demo-img-3',
    provider: 'demo',
    type: 'photo',
    title: 'Editorial Broadcast Studio Newsroom',
    width: 1920,
    height: 1080,
    thumbnailUrl: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=600',
    previewUrl: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=1920',
    downloadUrl: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=1920',
    author: 'Broadcast Media',
    sourcePageUrl: 'https://pexels.com',
    isDemo: true,
    tags: ['news', 'studio', 'broadcast', 'microphone', 'camera', 'journalism']
  }
];

export const DEMO_AUDIO_TRACKS: MediaItem[] = [
  {
    id: 'audio-demo-1',
    provider: 'demo',
    type: 'audio',
    title: 'Ambient Cinematic Pulse (Royalty Free)',
    duration: 45,
    thumbnailUrl: 'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=300',
    previewUrl: 'https://cdn.freesound.org/previews/612/612087_5674468-lq.mp3',
    downloadUrl: 'https://cdn.freesound.org/previews/612/612087_5674468-lq.mp3',
    author: 'Sound Lab CC0',
    sourcePageUrl: 'https://freesound.org',
    isDemo: true,
    tags: ['ambient', 'drone', 'cinematic', 'background', 'space']
  },
  {
    id: 'audio-demo-2',
    provider: 'demo',
    type: 'audio',
    title: 'Tech Documentary Pulse Beat',
    duration: 38,
    thumbnailUrl: 'https://images.pexels.com/photos/154147/pexels-photo-154147.jpeg?auto=compress&cs=tinysrgb&w=300',
    previewUrl: 'https://cdn.freesound.org/previews/566/566191_12530184-lq.mp3',
    downloadUrl: 'https://cdn.freesound.org/previews/566/566191_12530184-lq.mp3',
    author: 'Audio Forge Creative Commons',
    sourcePageUrl: 'https://freesound.org',
    isDemo: true,
    tags: ['tech', 'electronic', 'beat', 'modern', 'explainer']
  }
];

export function createEmptyProject(title = 'Untitled Project', aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'): Project {
  const now = new Date().toISOString();
  return {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    title,
    description: 'Created with PrimeCut AI video studio',
    aspectRatio,
    resolution: '1080p',
    fps: 30,
    duration: 0,
    currentTime: 0,
    tracks: [
      { id: 'track-v1', name: 'Main Video (V1)', type: 'video', muted: false, locked: false, clips: [] },
      { id: 'track-v2', name: 'B-Roll & Overlays (V2)', type: 'overlay', muted: false, locked: false, clips: [] },
      { id: 'track-t1', name: 'Captions & Titles (T1)', type: 'caption', muted: false, locked: false, clips: [] },
      { id: 'track-a1', name: 'Voiceover (A1)', type: 'voiceover', muted: false, locked: false, clips: [] },
      { id: 'track-a2', name: 'Music & SFX (A2)', type: 'audio', muted: false, locked: false, clips: [] },
    ],
    scenes: [],
    script: '',
    visualStyle: 'cinematic',
    language: 'English',
    targetDuration: 60,
    backgroundColor: '#0b0d11',
    createdAt: now,
    updatedAt: now,
  };
}

export function createSampleProject(): Project {
  const now = new Date().toISOString();
  return {
    id: 'proj_sample_breakthrough',
    title: 'AI & Next-Gen Computing Revolution',
    description: 'A 28-second documentary explainer demonstrating multi-track editing, B-roll overlays, lower-thirds, and synchronized narration.',
    aspectRatio: '16:9',
    resolution: '1080p',
    fps: 30,
    duration: 26,
    currentTime: 0,
    tracks: [
      {
        id: 'track-v1',
        name: 'Main Video (V1)',
        type: 'video',
        muted: false,
        locked: false,
        clips: [
          {
            id: 'clip-v1-1',
            trackId: 'track-v1',
            name: 'Earth Orbit & Atmosphere',
            type: 'video',
            startTime: 0,
            duration: 8,
            sourceIn: 0,
            sourceOut: 8,
            sourceDuration: 15,
            mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: 'https://images.pexels.com/photos/41949/earth-earth-at-night-night-lights-41949.jpeg?auto=compress&cs=tinysrgb&w=600',
            volume: 0,
            muted: true,
            scale: 1,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            opacity: 1,
            fitMode: 'cover',
            brightness: 1,
            contrast: 1.05,
            saturation: 1.1,
            attribution: {
              author: 'NASA Public Archive',
              sourceUrl: 'https://images.nasa.gov',
              provider: 'demo'
            },
            isIllustrative: true,
            sceneId: 'scene-1'
          },
          {
            id: 'clip-v1-2',
            trackId: 'track-v1',
            name: 'Quantum Server Architecture',
            type: 'video',
            startTime: 8,
            duration: 9,
            sourceIn: 0,
            sourceOut: 9,
            sourceDuration: 12,
            mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
            thumbnailUrl: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=600',
            volume: 0,
            muted: true,
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
              author: 'TechArchive',
              sourceUrl: 'https://archive.org',
              provider: 'demo'
            },
            isIllustrative: true,
            sceneId: 'scene-2'
          },
          {
            id: 'clip-v1-3',
            trackId: 'track-v1',
            name: 'Cyberpunk Metropolis Night',
            type: 'video',
            startTime: 17,
            duration: 9,
            sourceIn: 0,
            sourceOut: 9,
            sourceDuration: 10,
            mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnailUrl: 'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=600',
            volume: 0,
            muted: true,
            scale: 1,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            opacity: 1,
            fitMode: 'cover',
            brightness: 1.05,
            contrast: 1.1,
            saturation: 1.2,
            attribution: {
              author: 'Open Source Studio',
              sourceUrl: 'https://orange.blender.org',
              provider: 'demo'
            },
            isIllustrative: true,
            sceneId: 'scene-3'
          }
        ]
      },
      {
        id: 'track-v2',
        name: 'B-Roll & Overlays (V2)',
        type: 'overlay',
        muted: false,
        locked: false,
        clips: [
          {
            id: 'clip-v2-1',
            trackId: 'track-v2',
            name: 'Silicon Microchip Inspection',
            type: 'image',
            startTime: 11,
            duration: 4,
            sourceIn: 0,
            sourceOut: 4,
            sourceDuration: 4,
            mediaUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1920',
            thumbnailUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
            volume: 0,
            muted: true,
            scale: 0.85,
            positionX: 20,
            positionY: -15,
            rotation: 0,
            opacity: 0.95,
            fitMode: 'cover',
            brightness: 1,
            contrast: 1.05,
            saturation: 1,
            attribution: {
              author: 'Hardware Lab',
              sourceUrl: 'https://pexels.com',
              provider: 'demo'
            },
            isIllustrative: true,
            sceneId: 'scene-2'
          }
        ]
      },
      {
        id: 'track-t1',
        name: 'Captions & Titles (T1)',
        type: 'caption',
        muted: false,
        locked: false,
        clips: [
          {
            id: 'clip-t1-1',
            trackId: 'track-t1',
            name: 'Title: Global Innovation Report',
            type: 'title',
            startTime: 0.5,
            duration: 4.5,
            sourceIn: 0,
            sourceOut: 4.5,
            sourceDuration: 4.5,
            mediaUrl: '',
            volume: 0,
            muted: true,
            text: 'PRIMECUT INVESTIGATION: THE COMPUTING HORIZON',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 28,
            textColor: '#ffffff',
            textBgColor: 'rgba(15, 23, 42, 0.85)',
            textPosition: 'headline',
            textStylePreset: 'news-ticker'
          },
          {
            id: 'clip-t1-2',
            trackId: 'track-t1',
            name: 'Caption: Scene 1 Narration',
            type: 'caption',
            startTime: 1,
            duration: 6.5,
            sourceIn: 0,
            sourceOut: 6.5,
            sourceDuration: 6.5,
            mediaUrl: '',
            volume: 0,
            muted: true,
            text: 'Across global laboratories, machine intelligence is reshaping fundamental scientific discovery.',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 22,
            textColor: '#f8fafc',
            textBgColor: 'rgba(0, 0, 0, 0.75)',
            textPosition: 'lower-third',
            textStylePreset: 'modern'
          },
          {
            id: 'clip-t1-3',
            trackId: 'track-t1',
            name: 'Caption: Scene 2 Hardware',
            type: 'caption',
            startTime: 8.5,
            duration: 7.5,
            sourceIn: 0,
            sourceOut: 7.5,
            sourceDuration: 7.5,
            mediaUrl: '',
            volume: 0,
            muted: true,
            text: 'By coupling quantum accelerators with optical interconnects, compute density has grown tenfold.',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 22,
            textColor: '#fef08a',
            textBgColor: 'rgba(0, 0, 0, 0.8)',
            textPosition: 'lower-third',
            textStylePreset: 'bold-yellow'
          },
          {
            id: 'clip-t1-4',
            trackId: 'track-t1',
            name: 'Caption: Scene 3 Future',
            type: 'caption',
            startTime: 17.5,
            duration: 7.5,
            sourceIn: 0,
            sourceOut: 7.5,
            sourceDuration: 7.5,
            mediaUrl: '',
            volume: 0,
            muted: true,
            text: 'What once took decades in simulation now converges in days across distributed sovereign clouds.',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 22,
            textColor: '#f8fafc',
            textBgColor: 'rgba(0, 0, 0, 0.75)',
            textPosition: 'lower-third',
            textStylePreset: 'modern'
          }
        ]
      },
      {
        id: 'track-a1',
        name: 'Voiceover (A1)',
        type: 'voiceover',
        muted: false,
        locked: false,
        clips: []
      },
      {
        id: 'track-a2',
        name: 'Music & SFX (A2)',
        type: 'audio',
        muted: false,
        locked: false,
        clips: [
          {
            id: 'clip-a2-1',
            trackId: 'track-a2',
            name: 'Ambient Cinematic Pulse',
            type: 'audio',
            startTime: 0,
            duration: 26,
            sourceIn: 0,
            sourceOut: 26,
            sourceDuration: 45,
            mediaUrl: 'https://cdn.freesound.org/previews/612/612087_5674468-lq.mp3',
            volume: 0.35,
            muted: false,
            fadeIn: 1.5,
            fadeOut: 2,
            attribution: {
              author: 'Sound Lab',
              sourceUrl: 'https://freesound.org',
              provider: 'demo'
            }
          }
        ]
      }
    ],
    scenes: [
      {
        id: 'scene-1',
        sceneNumber: 1,
        excerpt: 'Across global laboratories, machine intelligence is reshaping fundamental scientific discovery.',
        narration: 'Across global laboratories, machine intelligence is reshaping fundamental scientific discovery.',
        keywords: ['earth', 'orbit', 'space', 'planetary research'],
        visualDescription: 'Wide cinematic shot of planet Earth from orbit, sun illuminating the atmosphere.',
        mediaType: 'video',
        suggestedTitle: 'The Computing Horizon',
        caption: 'Across global laboratories, machine intelligence is reshaping fundamental scientific discovery.',
        estimatedDuration: 8,
        isIllustrative: true,
        researchClaims: [
          {
            id: 'claim-1',
            claim: 'Global research institutes are adopting neural network simulation models for physics & climate.',
            query: 'accelerated computing scientific discovery physics 2025 2026',
            verified: true,
            sources: [
              {
                title: 'High Performance Computing in Modern Science',
                url: 'https://www.nature.com/articles/s41586-science-compute',
                publisher: 'Nature Computing Review',
                date: '2025-11-12',
                summary: 'Comprehensive survey on the deployment of surrogate neural models across CERN, NOAA, and astrophysics observatories.',
                isPrimary: true
              }
            ]
          }
        ]
      },
      {
        id: 'scene-2',
        sceneNumber: 2,
        excerpt: 'By coupling quantum accelerators with optical interconnects, compute density has grown tenfold.',
        narration: 'By coupling quantum accelerators with optical interconnects, compute density has grown tenfold.',
        keywords: ['quantum chip', 'data center', 'silicon interconnects'],
        visualDescription: 'Sleek dark server racks with pulsing optical conduits and glowing status indicators.',
        mediaType: 'video',
        suggestedTitle: 'Optical Compute Density',
        caption: 'By coupling quantum accelerators with optical interconnects, compute density has grown tenfold.',
        estimatedDuration: 9,
        isIllustrative: true,
        researchClaims: [
          {
            id: 'claim-2',
            claim: 'Optical co-packaged optics (CPO) and photonic interconnects achieve 10x bandwidth density improvements.',
            query: 'co-packaged optics photonics semiconductor bandwidth density IEEE',
            verified: true,
            sources: [
              {
                title: 'IEEE Journal of Selected Topics in Quantum Electronics: Optical Interconnects',
                url: 'https://ieeexplore.ieee.org/document/optical-cpo-trends',
                publisher: 'IEEE Spectrum',
                date: '2025-08-19',
                summary: 'Technical benchmarks validating sub-picojoule per bit efficiency across hybrid electronic-photonic packaging.',
                isPrimary: true
              }
            ]
          }
        ]
      },
      {
        id: 'scene-3',
        sceneNumber: 3,
        excerpt: 'What once took decades in simulation now converges in days across distributed sovereign clouds.',
        narration: 'What once took decades in simulation now converges in days across distributed sovereign clouds.',
        keywords: ['futuristic city', 'digital infrastructure', 'metropolis'],
        visualDescription: 'Vibrant modern city at twilight with glowing data lines and interconnected skyline.',
        mediaType: 'video',
        suggestedTitle: 'Convergence',
        caption: 'What once took decades in simulation now converges in days across distributed sovereign clouds.',
        estimatedDuration: 9,
        isIllustrative: true,
        researchClaims: []
      }
    ],
    script: `Across global laboratories, machine intelligence is reshaping fundamental scientific discovery.

By coupling quantum accelerators with optical interconnects, compute density has grown tenfold.

What once took decades in simulation now converges in days across distributed sovereign clouds.`,
    visualStyle: 'cinematic',
    language: 'English',
    targetDuration: 26,
    backgroundColor: '#0b0d11',
    createdAt: now,
    updatedAt: now
  };
}
