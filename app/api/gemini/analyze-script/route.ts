import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script, targetDuration = 60, visualStyle = 'cinematic', language = 'English' } = body;

    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json(
        { error: 'Script text is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured on the server. Please configure it in AI Studio Secrets.',
          configured: false
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a professional video editor and script breakdown specialist for long-form video production.
Your task is to analyze the user's video script and break it down into an ordered sequence of visually compelling scenes for multi-track editing.

Guidelines:
1. Target overall video duration: approximately ${targetDuration} seconds.
2. Visual style: ${visualStyle} (News, Documentary, Educational, Explainer, or Cinematic).
3. Language: ${language}.
4. Each scene must map directly to a segment of the original script.
5. Provide 3-5 specific, relevant stock search keywords per scene (e.g., ["solar flare macro", "astronomy telescope", "deep space"]).
6. For each scene, specify if the footage is "illustrative" (symbolic B-roll / visual metaphor) versus "actual event" footage.
7. If the script contains specific factual assertions, statistical figures, scientific claims, or quotes, extract them into the researchClaims array with a targeted search query for fact-checking.
8. Set estimatedDuration in seconds (typically 4 to 12 seconds per scene). Ensure the sum of durations aligns smoothly with the target duration.
9. Do NOT rewrite or alter the user's narration without preserving the original meaning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Script to break down:\n\n${script}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of video scenes broken down from the script.',
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER, description: '1-based sequential scene index' },
              excerpt: { type: Type.STRING, description: 'Direct excerpt from the script' },
              narration: { type: Type.STRING, description: 'Voiceover text for this scene' },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Search keywords for stock video/photo retrieval'
              },
              visualDescription: { type: Type.STRING, description: 'Concise visual description for footage matching' },
              mediaType: { type: Type.STRING, description: '"video" or "photo"' },
              suggestedTitle: { type: Type.STRING, description: 'Short on-screen lower third or title' },
              caption: { type: Type.STRING, description: 'Subtitle text to render on screen' },
              estimatedDuration: { type: Type.NUMBER, description: 'Duration of scene in seconds (4-15)' },
              isIllustrative: { type: Type.BOOLEAN, description: 'True if footage is illustrative B-roll, false if actual event' },
              researchClaims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claim: { type: Type.STRING, description: 'Specific factual assertion or statistic in the scene' },
                    query: { type: Type.STRING, description: 'Web search query to verify this claim' }
                  },
                  required: ['claim', 'query']
                },
                description: 'Factual claims requiring source verification'
              }
            },
            required: [
              'sceneNumber',
              'excerpt',
              'narration',
              'keywords',
              'visualDescription',
              'mediaType',
              'suggestedTitle',
              'caption',
              'estimatedDuration',
              'isIllustrative'
            ]
          }
        }
      }
    });

    const rawText = response.text?.trim() || '[]';
    let scenesData = [];
    try {
      scenesData = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', parseErr, rawText);
      return NextResponse.json(
        { error: 'Failed to parse structured scene output from Gemini model.' },
        { status: 500 }
      );
    }

    // Format and assign stable IDs
    let currentNarrationTime = 0;
    const formattedScenes = scenesData.map((s: any, idx: number) => {
      const dur = Math.max(3, Math.min(30, Number(s.estimatedDuration) || 6));
      const startTime = currentNarrationTime;
      currentNarrationTime += dur;

      return {
        id: `scene-${idx + 1}-${Date.now().toString(36)}`,
        sceneNumber: idx + 1,
        excerpt: s.excerpt || s.narration || '',
        narration: s.narration || s.excerpt || '',
        keywords: Array.isArray(s.keywords) && s.keywords.length > 0 ? s.keywords : ['cinematic footage'],
        visualDescription: s.visualDescription || 'Visual representation of scene',
        mediaType: s.mediaType === 'photo' ? 'photo' : 'video',
        suggestedTitle: s.suggestedTitle || `Scene ${idx + 1}`,
        caption: s.caption || s.narration || '',
        estimatedDuration: dur,
        isIllustrative: s.isIllustrative !== undefined ? Boolean(s.isIllustrative) : true,
        narrationStart: startTime,
        narrationEnd: currentNarrationTime,
        researchClaims: Array.isArray(s.researchClaims)
          ? s.researchClaims.map((rc: any, rIdx: number) => ({
              id: `claim-${idx + 1}-${rIdx + 1}`,
              claim: rc.claim || '',
              query: rc.query || rc.claim || '',
              verified: false,
              sources: []
            }))
          : []
      };
    });

    return NextResponse.json({
      success: true,
      scenes: formattedScenes,
      totalScenes: formattedScenes.length,
      estimatedDuration: currentNarrationTime
    });
  } catch (error: any) {
    console.error('Script analysis error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred during script analysis.' },
      { status: 500 }
    );
  }
}
