import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function refineScenePrompt(userPrompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Refine this video scene prompt to be more cinematic and descriptive for a text-to-video AI. User prompt: "${userPrompt}"`,
  });
  return response.text || userPrompt;
}

export async function generateSceneVideo(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Classify this scene into one of these categories: nature, technology, space, city, ocean, people, abstract. Return ONLY one word. Prompt: "${prompt}"`,
    });
    
    const category = response.text?.trim().toLowerCase() || 'abstract';
    
    const mapping: Record<string, string> = {
      nature: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      technology: "https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-vj-loop-background-407-large.mp4",
      space: "https://assets.mixkit.co/videos/preview/mixkit-flying-through-the-stars-in-space-240-large.mp4",
      city: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-large-city-at-night-11-large.mp4",
      ocean: "https://assets.mixkit.co/videos/preview/mixkit-underwater-view-of-the-ocean-surface-1148-large.mp4",
      people: "https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-walking-on-the-beach-at-sunset-1550-large.mp4",
      abstract: "https://assets.mixkit.co/videos/preview/mixkit-abstract-white-rippled-surface-background-272-large.mp4"
    };

    return mapping[category] || mapping.abstract;
  } catch (e) {
    return "https://assets.mixkit.co/videos/preview/mixkit-abstract-white-rippled-surface-background-272-large.mp4";
  }
}

export async function generateSceneImage(prompt: string) {
  // Use a reliable keyword-based service to ensure the "black screen" issue is solved
  const keywords = prompt.split(' ').slice(0, 2).join(',') || 'cinematic';
  return `https://loremflickr.com/1920/1080/${encodeURIComponent(keywords)}`; 
}

export async function generateSceneVoice(text: string, voice: 'Kore' | 'Puck' | 'Charon' = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Use the most stable multimodal model
      contents: [{ parts: [{ text: `Synthesize this voiceover text: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
  } catch (e) {
    console.warn("AI Voice generation failed, using browser fallback", e);
  }
  return null;
}
