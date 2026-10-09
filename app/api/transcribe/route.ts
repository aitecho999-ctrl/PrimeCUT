import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Audio, mimeType = 'audio/mp3', filename = 'voiceover.mp3' } = body;

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on server.' },
        { status: 503 }
      );
    }

    if (!base64Audio) {
      return NextResponse.json(
        { error: 'Audio data is required for transcription.' },
        { status: 400 }
      );
    }

    // Call Gemini 3.5 transcribe or gemini-3.8-flash
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/mp3',
        data: base64Audio,
      },
    };

    const promptText = `Please transcribe this audio recording accurately.
Format the output as a clean text transcript suitable for generating video scenes and subtitle captions.
Preserve exact wording. Include paragraph breaks at natural pauses.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, { text: promptText }] },
    });

    const transcript = response.text || '';

    return NextResponse.json({
      success: true,
      filename,
      transcript,
      message: 'Audio transcribed successfully.'
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    // If gemini-3.5-transcribe model is unavailable, gracefully inform
    return NextResponse.json(
      { error: error?.message || 'Failed to transcribe audio recording.' },
      { status: 500 }
    );
  }
}
