import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { ProviderStatus } from '@/types/project';

export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const pexelsConfigured = Boolean(process.env.PEXELS_API_KEY);
  const pixabayConfigured = Boolean(process.env.PIXABAY_API_KEY);
  const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY);
  const newsConfigured = Boolean(process.env.NEWS_API_KEY);
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

  const statuses: ProviderStatus[] = [
    {
      name: 'Google Gemini AI',
      providerKey: 'gemini',
      configured: geminiConfigured,
      isOptional: false,
      description: 'Powers automatic script analysis, scene breakdown, keyword tagging, and fact-checking extraction.',
      statusMessage: geminiConfigured ? 'Ready (GEMINI_API_KEY injected)' : 'Missing GEMINI_API_KEY in Secrets'
    },
    {
      name: 'Pexels Stock Media',
      providerKey: 'pexels',
      configured: pexelsConfigured,
      isOptional: true,
      description: 'Search hundreds of thousands of HD/4K royalty-free video clips and stock photography.',
      statusMessage: pexelsConfigured ? 'Connected (Live search enabled)' : 'Using curated HD demo fixtures. Add PEXELS_API_KEY to enable live search.'
    },
    {
      name: 'Pixabay Stock Library',
      providerKey: 'pixabay',
      configured: pixabayConfigured,
      isOptional: true,
      description: 'Search 4M+ high-resolution creative commons videos, photos, and vector assets.',
      statusMessage: pixabayConfigured ? 'Connected (Live search enabled)' : 'Using curated HD demo fixtures. Add PIXABAY_API_KEY to enable live search.'
    },
    {
      name: 'Tavily Web Search',
      providerKey: 'tavily',
      configured: tavilyConfigured,
      isOptional: true,
      description: 'Real-time deep web research and primary source retrieval for news & documentary claims.',
      statusMessage: tavilyConfigured ? 'Connected (Live research enabled)' : 'Add TAVILY_API_KEY in Secrets for live journalistic source retrieval.'
    },
    {
      name: 'News API',
      providerKey: 'news',
      configured: newsConfigured,
      isOptional: true,
      description: 'Global breaking headlines, wire service reports, and publication date indexing.',
      statusMessage: newsConfigured ? 'Connected' : 'Optional. Add NEWS_API_KEY in Secrets.'
    },
    {
      name: 'Supabase Cloud Persistence',
      providerKey: 'supabase',
      configured: supabaseConfigured,
      isOptional: true,
      description: 'Optional cloud database for synchronizing projects and video media across devices.',
      statusMessage: supabaseConfigured ? 'Configured' : 'Browser local storage active. Add SUPABASE_URL & ANON_KEY for cloud sync.'
    }
  ];

  return NextResponse.json({
    success: true,
    providers: statuses,
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    const { provider } = await req.json();
    const startTime = Date.now();

    if (provider === 'gemini') {
      const ai = getGeminiClient();
      if (!ai) {
        return NextResponse.json({
          provider,
          success: false,
          message: 'GEMINI_API_KEY is not defined in server environment.',
          latencyMs: 0
        });
      }
      // Light test call
      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping test. Respond with OK.',
      });
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        provider,
        success: Boolean(res.text),
        message: 'Gemini 3.8 Flash responded successfully.',
        latencyMs
      });
    }

    if (provider === 'pexels') {
      const key = process.env.PEXELS_API_KEY;
      if (!key) {
        return NextResponse.json({
          provider,
          success: false,
          message: 'PEXELS_API_KEY is missing. Demo fixtures are used in editor.',
          latencyMs: 0
        });
      }
      const pRes = await fetch('https://api.pexels.com/v1/curated?per_page=1', {
        headers: { Authorization: key }
      });
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        provider,
        success: pRes.ok,
        message: pRes.ok ? 'Pexels API authenticated successfully.' : `Pexels returned status ${pRes.status}`,
        latencyMs
      });
    }

    if (provider === 'pixabay') {
      const key = process.env.PIXABAY_API_KEY;
      if (!key) {
        return NextResponse.json({
          provider,
          success: false,
          message: 'PIXABAY_API_KEY is missing. Demo fixtures are used in editor.',
          latencyMs: 0
        });
      }
      const piRes = await fetch(`https://pixabay.com/api/?key=${key}&q=video&per_page=3`);
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        provider,
        success: piRes.ok,
        message: piRes.ok ? 'Pixabay API authenticated successfully.' : `Pixabay returned status ${piRes.status}`,
        latencyMs
      });
    }

    if (provider === 'tavily') {
      const key = process.env.TAVILY_API_KEY;
      if (!key) {
        return NextResponse.json({
          provider,
          success: false,
          message: 'TAVILY_API_KEY is missing. Add in Secrets to enable live research.',
          latencyMs: 0
        });
      }
      const tRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query: 'news test', max_results: 1 })
      });
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        provider,
        success: tRes.ok,
        message: tRes.ok ? 'Tavily search API connected successfully.' : `Tavily returned status ${tRes.status}`,
        latencyMs
      });
    }

    return NextResponse.json({
      provider,
      success: false,
      message: 'Unknown or unconfigured provider test.'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err?.message || 'Connection test failed.'
    });
  }
}
