// Gemini Nano (window.ai) integration for local AI processing

export interface PhotoAnalysis {
  gender: string;
  bodyType: string;
  pose: string;
  estimatedHeight: number;
  shoulderWidth: number;
  waist: number;
  hip: number;
  scaleFactor: number;
  searchQuery: string;
}

export async function isGeminiNanoAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // @ts-ignore - window.ai is experimental
    return typeof window.ai?.languageModel !== 'undefined';
  } catch {
    return false;
  }
}

export async function analyzePhoto(imageDataUrl: string): Promise<PhotoAnalysis> {
  try {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.ai?.languageModel) {
      // @ts-ignore
      const session = await window.ai.languageModel.create({
        temperature: 0.3,
        topK: 3,
      });

      const prompt = `You are a professional fashion and body measurement AI assistant. Analyze this full-body photo and provide detailed information.

Image: ${imageDataUrl.substring(0, 100)}... (truncated)

Based on visual analysis, provide a JSON response with:
- gender: "male", "female", or "neutral" presentation
- bodyType: description like "lean athletic", "muscular", "average", "curvy", etc.
- pose: "front-facing", "side-view", "three-quarter", etc.
- estimatedHeight: in cm (typical range 150-200)
- shoulderWidth: in cm (typical range 35-55)
- waist: in cm (typical range 60-120)
- hip: in cm (typical range 75-130)
- scaleFactor: float representing overall body scale (0.8-1.2)

Also generate a concise search query for finding suitable outfit images online.
Format: "descriptive outfit style gender presentation full body front view"
Example: "streetwear bomber jacket male athletic full body front view"

Respond with ONLY valid JSON, no other text.`;

      const response = await session.prompt(prompt);

      // Parse the JSON response
      const analysis = JSON.parse(response);

      return {
        gender: analysis.gender || 'neutral',
        bodyType: analysis.bodyType || 'average',
        pose: analysis.pose || 'front-facing',
        estimatedHeight: analysis.estimatedHeight || 170,
        shoulderWidth: analysis.shoulderWidth || 45,
        waist: analysis.waist || 80,
        hip: analysis.hip || 95,
        scaleFactor: analysis.scaleFactor || 1.0,
        searchQuery: analysis.searchQuery || generateFallbackQuery(analysis),
      };
    }
  } catch (error) {
    console.warn('Gemini Nano analysis failed, using fallback:', error);
  }

  // Fallback if Gemini Nano is unavailable or fails
  return {
    gender: 'neutral',
    bodyType: 'average',
    pose: 'front-facing',
    estimatedHeight: 170,
    shoulderWidth: 45,
    waist: 80,
    hip: 95,
    scaleFactor: 1.0,
    searchQuery: 'casual outfit full body front view',
  };
}

export async function generateSearchQuery(
  userPreferences?: {
    style?: string;
    occasion?: string;
    colors?: string[];
  }
): Promise<string> {
  try {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.ai?.languageModel) {
      // @ts-ignore
      const session = await window.ai.languageModel.create({ temperature: 0.7 });

      const prompt = `Generate a concise Google Images search query for finding outfit photos.

Preferences:
- Style: ${userPreferences?.style || 'any'}
- Occasion: ${userPreferences?.occasion || 'casual'}
- Colors: ${userPreferences?.colors?.join(', ') || 'any'}

Requirements:
- Must include "full body"
- Must include "front view"
- Should be 5-8 words
- Focus on the outfit, not the person

Respond with ONLY the search query, nothing else.`;

      const query = await session.prompt(prompt);
      return query.trim();
    }
  } catch (error) {
    console.warn('Search query generation failed, using fallback:', error);
  }

  // Fallback query
  const style = userPreferences?.style || 'casual';
  return `${style} outfit full body front view`;
}

function generateFallbackQuery(analysis: Partial<PhotoAnalysis>): string {
  const gender = analysis.gender || 'neutral';
  const bodyType = analysis.bodyType || 'average';

  return `casual outfit ${gender} ${bodyType} full body front view`;
}

export async function enhanceSearchQuery(
  baseQuery: string,
  photoAnalysis: PhotoAnalysis
): Promise<string> {
  // Enhance the search query with photo analysis context
  const { gender, bodyType } = photoAnalysis;

  // Add relevant descriptors if not already present
  let enhanced = baseQuery;

  if (!enhanced.includes(gender) && gender !== 'neutral') {
    enhanced = `${gender} ${enhanced}`;
  }

  if (!enhanced.includes('full body')) {
    enhanced += ' full body';
  }

  if (!enhanced.includes('front view') && !enhanced.includes('front-facing')) {
    enhanced += ' front view';
  }

  return enhanced;
}
