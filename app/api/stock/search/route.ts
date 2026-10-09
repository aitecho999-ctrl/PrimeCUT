import { NextRequest, NextResponse } from 'next/server';
import { MediaItem } from '@/types/project';
import { DEMO_STOCK_MEDIA } from '@/lib/sample-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || 'cinematic';
    const provider = searchParams.get('provider') || 'all'; // 'all' | 'pexels' | 'pixabay'
    const mediaType = searchParams.get('type') || 'all'; // 'all' | 'video' | 'photo'
    const orientation = searchParams.get('orientation') || 'landscape'; // 'landscape' | 'portrait' | 'square'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '12', 10);

    const pexelsKey = process.env.PEXELS_API_KEY;
    const pixabayKey = process.env.PIXABAY_API_KEY;

    const results: MediaItem[] = [];
    const providersChecked: { name: string; active: boolean; error?: string; count: number }[] = [];

    // 1. PEXELS API QUERY
    if (pexelsKey && (provider === 'all' || provider === 'pexels')) {
      try {
        let pexelsItems: MediaItem[] = [];
        
        // Videos
        if (mediaType === 'all' || mediaType === 'video') {
          const videoRes = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=${orientation === 'portrait' ? 'portrait' : 'landscape'}`,
            {
              headers: { Authorization: pexelsKey },
              next: { revalidate: 60 }
            }
          );
          if (videoRes.ok) {
            const vData = await videoRes.json();
            if (vData.videos && Array.isArray(vData.videos)) {
              for (const v of vData.videos) {
                // Find a reasonable quality file (prefer 720p or 1080p hd or sd)
                const files = v.video_files || [];
                const sortedFiles = [...files].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                const targetFile = sortedFiles.find((f: any) => f.quality === 'hd') || sortedFiles[0];

                if (targetFile) {
                  pexelsItems.push({
                    id: `pexels-vid-${v.id}`,
                    provider: 'pexels',
                    type: 'video',
                    title: `Pexels Video by ${v.user?.name || 'Creator'}`,
                    duration: v.duration || 10,
                    width: v.width,
                    height: v.height,
                    thumbnailUrl: v.image || targetFile.link,
                    previewUrl: targetFile.link,
                    downloadUrl: targetFile.link,
                    author: v.user?.name || 'Pexels Contributor',
                    authorUrl: v.user?.url,
                    sourcePageUrl: v.url,
                    isDemo: false,
                    tags: [query, 'pexels', 'video']
                  });
                }
              }
            }
          }
        }

        // Photos
        if (mediaType === 'all' || mediaType === 'photo') {
          const photoRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=${orientation === 'portrait' ? 'portrait' : 'landscape'}`,
            {
              headers: { Authorization: pexelsKey },
              next: { revalidate: 60 }
            }
          );
          if (photoRes.ok) {
            const pData = await photoRes.json();
            if (pData.photos && Array.isArray(pData.photos)) {
              for (const p of pData.photos) {
                pexelsItems.push({
                  id: `pexels-photo-${p.id}`,
                  provider: 'pexels',
                  type: 'photo',
                  title: p.alt || `Pexels Photo by ${p.photographer}`,
                  width: p.width,
                  height: p.height,
                  thumbnailUrl: p.src?.medium || p.src?.small,
                  previewUrl: p.src?.large2x || p.src?.large || p.src?.original,
                  downloadUrl: p.src?.original || p.src?.large,
                  author: p.photographer,
                  authorUrl: p.photographer_url,
                  sourcePageUrl: p.url,
                  isDemo: false,
                  tags: [query, 'pexels', 'photo']
                });
              }
            }
          }
        }

        providersChecked.push({ name: 'Pexels', active: true, count: pexelsItems.length });
        results.push(...pexelsItems);
      } catch (pexErr: any) {
        console.error('Pexels API error:', pexErr);
        providersChecked.push({ name: 'Pexels', active: true, error: pexErr.message, count: 0 });
      }
    } else if (!pexelsKey && (provider === 'all' || provider === 'pexels')) {
      providersChecked.push({ name: 'Pexels', active: false, count: 0 });
    }

    // 2. PIXABAY API QUERY
    if (pixabayKey && (provider === 'all' || provider === 'pixabay')) {
      try {
        let pixabayItems: MediaItem[] = [];

        // Videos
        if (mediaType === 'all' || mediaType === 'video') {
          const pVidRes = await fetch(
            `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=${orientation === 'portrait' ? 'vertical' : 'horizontal'}`,
            { next: { revalidate: 60 } }
          );
          if (pVidRes.ok) {
            const pvData = await pVidRes.json();
            if (pvData.hits && Array.isArray(pvData.hits)) {
              for (const v of pvData.hits) {
                const vidDetails = v.videos?.medium || v.videos?.small || v.videos?.large;
                if (vidDetails) {
                  pixabayItems.push({
                    id: `pixabay-vid-${v.id}`,
                    provider: 'pixabay',
                    type: 'video',
                    title: v.tags || `Pixabay Video by ${v.user}`,
                    duration: v.duration || 10,
                    width: vidDetails.width,
                    height: vidDetails.height,
                    thumbnailUrl: v.picture_id ? `https://i.vimeocdn.com/video/${v.picture_id}_640x360.jpg` : vidDetails.url,
                    previewUrl: vidDetails.url,
                    downloadUrl: vidDetails.url,
                    author: v.user,
                    sourcePageUrl: v.pageURL,
                    isDemo: false,
                    tags: v.tags ? v.tags.split(',').map((t: string) => t.trim()) : [query, 'pixabay']
                  });
                }
              }
            }
          }
        }

        // Photos
        if (mediaType === 'all' || mediaType === 'photo') {
          const pImgRes = await fetch(
            `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=${orientation === 'portrait' ? 'vertical' : 'horizontal'}`,
            { next: { revalidate: 60 } }
          );
          if (pImgRes.ok) {
            const piData = await pImgRes.json();
            if (piData.hits && Array.isArray(piData.hits)) {
              for (const p of piData.hits) {
                pixabayItems.push({
                  id: `pixabay-photo-${p.id}`,
                  provider: 'pixabay',
                  type: 'photo',
                  title: p.tags || `Pixabay Photo by ${p.user}`,
                  width: p.imageWidth,
                  height: p.imageHeight,
                  thumbnailUrl: p.webformatURL || p.previewURL,
                  previewUrl: p.largeImageURL || p.webformatURL,
                  downloadUrl: p.largeImageURL,
                  author: p.user,
                  sourcePageUrl: p.pageURL,
                  isDemo: false,
                  tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [query, 'pixabay']
                });
              }
            }
          }
        }

        providersChecked.push({ name: 'Pixabay', active: true, count: pixabayItems.length });
        results.push(...pixabayItems);
      } catch (pixErr: any) {
        console.error('Pixabay API error:', pixErr);
        providersChecked.push({ name: 'Pixabay', active: true, error: pixErr.message, count: 0 });
      }
    } else if (!pixabayKey && (provider === 'all' || provider === 'pixabay')) {
      providersChecked.push({ name: 'Pixabay', active: false, count: 0 });
    }

    // 3. FALLBACK / DEMO FIXTURES (Transparently marked when no API keys or no results)
    const hasLiveKeys = Boolean(pexelsKey || pixabayKey);
    let demoResults: MediaItem[] = [];

    if (!hasLiveKeys || results.length === 0) {
      // Filter demo media by query relevance
      const lowerQ = query.toLowerCase();
      const qTokens = lowerQ.split(/\s+/).filter(Boolean);

      demoResults = DEMO_STOCK_MEDIA.filter((item) => {
        if (mediaType !== 'all' && item.type !== mediaType) return false;
        if (qTokens.length === 0) return true;
        const matchesTitle = qTokens.some(t => item.title.toLowerCase().includes(t));
        const matchesTag = qTokens.some(t => item.tags.some(tag => tag.toLowerCase().includes(t)));
        return matchesTitle || matchesTag;
      });

      // If strict token search returned 0 items, include general demo media so the user has immediate assets to test
      if (demoResults.length === 0) {
        demoResults = DEMO_STOCK_MEDIA.filter(item => mediaType === 'all' || item.type === mediaType);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      provider,
      mediaType,
      isDemoOnly: !hasLiveKeys,
      providers: providersChecked,
      hasLiveKeys,
      totalLiveResults: results.length,
      totalDemoResults: demoResults.length,
      results: results.length > 0 ? results : demoResults,
      note: !hasLiveKeys
        ? 'Showing labeled DEMO DATA. Configure PEXELS_API_KEY and/or PIXABAY_API_KEY in Settings > Secrets to unlock live searches.'
        : undefined
    });
  } catch (error: any) {
    console.error('Stock search route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error occurred while querying stock media providers.' },
      { status: 500 }
    );
  }
}
