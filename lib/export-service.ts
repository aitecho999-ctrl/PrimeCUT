import { Project, TimelineClip } from '@/types/project';

// Formats seconds into SRT timestamp format: 00:01:23,456
export function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

// Generates an .SRT file string from caption/text clips in the project
export function generateSrtContent(project: Project): string {
  const captionTrack = project.tracks.find(t => t.type === 'caption');
  if (!captionTrack || captionTrack.clips.length === 0) {
    return '1\n00:00:00,000 --> 00:00:05,000\nNo captions found in project.\n';
  }

  const sortedClips = [...captionTrack.clips].sort((a, b) => a.startTime - b.startTime);
  const srtBlocks = sortedClips.map((clip, index) => {
    const start = formatSrtTime(clip.startTime);
    const end = formatSrtTime(clip.startTime + clip.duration);
    const text = clip.text || clip.name;
    return `${index + 1}\n${start} --> ${end}\n${text}\n`;
  });

  return srtBlocks.join('\n');
}

// Download file utility
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Download Project JSON
export function downloadProjectJson(project: Project) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_primecut_backup.json`;
  downloadBlob(blob, filename);
}
