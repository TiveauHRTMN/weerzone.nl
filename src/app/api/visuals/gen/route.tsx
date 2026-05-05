import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nano Banana 2.1 - Local Visual Engine (Standard Fallback)
 * This replaces the external visuals.weerzone.nl engine when it's offline.
 * It generates real AI images via bridge or beautiful context-aware gradients.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt") || "Weather";
  const city = searchParams.get("city") || "";
  const style = searchParams.get("style") || "cinematic";

  try {
    // NANO BANANA 2.1 - High-Fidelity Image Generation Bridge
    let finalPrompt = prompt;
    if (style === "emoji") {
      // NANO BANANA 2.2 - Premium Glassmorphic Icons
      finalPrompt = `Premium 3D glassmorphic icon of ${prompt}, Apple-style minimalist design, soft translucent textures, elegant studio lighting, high-end digital art, clean isolated white background, 8k octane render, professional UI asset, sleek and modern`;
    } else {
      // Standard cinematic weather photography
      finalPrompt = `${prompt}, cinematic weather photography, 8k, highly detailed, atmospheric, national geographic style, professional color grading`;
    }

    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1200&height=630&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;

    // Fetch the image from the AI provider
    const imageRes = await fetch(aiImageUrl);
    if (!imageRes.ok) throw new Error("AI Image Bridge Failed");
    
    const imageBuffer = await imageRes.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e: any) {
    // Fallback to the beautiful gradient engine if the AI bridge fails
    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 60, fontWeight: 900, color: 'white' }}>{city || 'WEERZONE'}</div>
          <div style={{ fontSize: 20, color: 'white', opacity: 0.8 }}>Nano Banana 2.1 Fallback</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
