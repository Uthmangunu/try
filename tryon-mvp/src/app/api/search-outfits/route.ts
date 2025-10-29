import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return NextResponse.json(
        { error: 'SERPAPI_KEY not configured' },
        { status: 500 }
      );
    }

    // Search for outfit images using SerpAPI Google Images
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_images',
        q: query,
        api_key: serpApiKey,
        num: 12, // Get 12 outfit options
        tbm: 'isch',
        ijn: 0,
        // Filter for high-quality, full-body outfit images
        tbs: 'isz:l', // Large images
      },
    });

    const images = response.data.images_results || [];

    // Filter and format results
    const outfits = images
      .filter((img: any) => {
        // Filter out images that are too small or missing data
        return img.original && img.thumbnail && img.original_width > 400;
      })
      .map((img: any) => ({
        id: img.position || Math.random().toString(36).substr(2, 9),
        url: img.original,
        thumbnail: img.thumbnail,
        title: img.title || 'Outfit',
        source: img.source || 'Unknown',
        width: img.original_width,
        height: img.original_height,
      }))
      .slice(0, 12);

    return NextResponse.json({ outfits, query });
  } catch (error: any) {
    console.error('Search outfits error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search outfits' },
      { status: 500 }
    );
  }
}
