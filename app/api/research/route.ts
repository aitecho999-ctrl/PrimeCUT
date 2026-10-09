import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { ResearchSource } from '@/types/project';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, claim = '', sceneId = '' } = body;

    if (!query && !claim) {
      return NextResponse.json(
        { error: 'A query or factual claim is required for research.' },
        { status: 400 }
      );
    }

    const searchQuery = (query || claim).trim();
    const tavilyKey = process.env.TAVILY_API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;
    const sources: ResearchSource[] = [];
    let providerUsed = 'none';
    let analysisNotes = '';
    let isVerified = false;
    let isConflicting = false;
    let isUnverified = true;

    // 1. TAVILY SEARCH (Primary if configured)
    if (tavilyKey) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: searchQuery,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5
          })
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          providerUsed = 'tavily';
          if (Array.isArray(tavilyData.results)) {
            for (const r of tavilyData.results) {
              const urlHost = new URL(r.url).hostname.replace(/^www\./, '');
              sources.push({
                title: r.title || 'Referenced Document',
                url: r.url,
                publisher: urlHost,
                date: r.published_date || undefined,
                summary: r.content ? r.content.slice(0, 240) + '...' : '',
                isPrimary: Boolean(urlHost.endsWith('.gov') || urlHost.endsWith('.edu') || urlHost.includes('nature') || urlHost.includes('science'))
              });
            }
          }
          if (tavilyData.answer) {
            analysisNotes = tavilyData.answer;
          }
        }
      } catch (tavErr: any) {
        console.error('Tavily search failed:', tavErr);
      }
    }

    // 2. NEWS API (Secondary if configured and tavily not used)
    if (sources.length === 0 && newsApiKey) {
      try {
        const newsRes = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&pageSize=5&sortBy=relevancy&apiKey=${newsApiKey}`
        );
        if (newsRes.ok) {
          const nData = await newsRes.json();
          providerUsed = 'newsapi';
          if (Array.isArray(nData.articles)) {
            for (const a of nData.articles) {
              if (a.url && a.title) {
                sources.push({
                  title: a.title,
                  url: a.url,
                  publisher: a.source?.name || 'News Source',
                  date: a.publishedAt ? a.publishedAt.split('T')[0] : undefined,
                  summary: a.description || a.content?.slice(0, 200) || '',
                  isPrimary: false
                });
              }
            }
          }
        }
      } catch (newsErr: any) {
        console.error('News API failed:', newsErr);
      }
    }

    // 3. GEMINI VERIFICATION (if Gemini client is available, evaluate sources and claim)
    const ai = getGeminiClient();
    if (ai) {
      try {
        const promptText = sources.length > 0
          ? `Evaluate this claim against the retrieved sources:
Claim: "${claim || searchQuery}"
Retrieved Sources:
${JSON.stringify(sources, null, 2)}

Determine:
1. Is the claim substantiated by the sources? (VERIFIED / CONFLICTING / UNVERIFIED)
2. A short 2-sentence objective summary of factual findings.`
          : `Analyze this claim and identify what official primary sources (e.g. government registers, peer-reviewed journals, official corporate filings) are required to verify it:
Claim: "${claim || searchQuery}"`;

        const geminiEval = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            temperature: 0.1,
            systemInstruction: 'You are an objective journalistic fact-checker. Never hallucinate sources. If no live web search results were provided, state that live verification requires an external search API key.'
          }
        });

        const evalText = geminiEval.text || '';
        if (sources.length > 0) {
          if (evalText.includes('VERIFIED')) {
            isVerified = true;
            isUnverified = false;
          } else if (evalText.includes('CONFLICTING')) {
            isConflicting = true;
            isUnverified = false;
          }
        }
        if (!analysisNotes) {
          analysisNotes = evalText;
        }
      } catch (evalErr) {
        console.error('Gemini verification eval error:', evalErr);
      }
    }

    const hasLiveProvider = Boolean(tavilyKey || newsApiKey);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      claim,
      sceneId,
      providerUsed,
      hasLiveProvider,
      sources,
      isVerified,
      isConflicting,
      isUnverified: !isVerified && !isConflicting,
      analysisNotes,
      statusMessage: hasLiveProvider
        ? `Found ${sources.length} sources via ${providerUsed}.`
        : 'Live web search is not configured. Configure TAVILY_API_KEY in Settings > Secrets for real-time live article retrieval.'
    });
  } catch (error: any) {
    console.error('Research route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error occurred during web research execution.' },
      { status: 500 }
    );
  }
}
