import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ImagePrompt, GeneratedImage } from '@/lib/types';

interface ImageGenerateParams {
  prompt: string;
  aspectRatio: '16:9' | '1:1';
  type: 'thumbnail' | 'content';
}

interface ImageGenerateResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export async function generateImage(params: ImageGenerateParams): Promise<ImageGenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === '여기에_입력') {
    return { success: false, error: 'GEMINI_API_KEY가 설정되지 않았습니다.' };
  }

  const ratioHint = params.aspectRatio === '16:9'
    ? 'wide landscape format, 16:9 aspect ratio'
    : 'square format, 1:1 aspect ratio';

  const fullPrompt = `${params.prompt}, ${ratioHint}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

    const response = await model.generateContent(fullPrompt);

    const parts = response.response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => 'inlineData' in p && p.inlineData);

    if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData) {
      return { success: false, error: '이미지 데이터가 응답에 없습니다.' };
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const dataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
    return { success: true, dataUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImagesForDraft(imagePrompts: ImagePrompt[]): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];

  for (const prompt of imagePrompts) {
    const result = await generateImage({
      prompt: prompt.prompt,
      aspectRatio: prompt.aspectRatio,
      type: prompt.type,
    });

    if (result.success && result.dataUrl) {
      results.push({
        type: prompt.type,
        aspectRatio: prompt.aspectRatio,
        url: result.dataUrl,
        altText: prompt.altText,
        insertAfterSection: prompt.insertAfterSection,
      });
    }

    if (imagePrompts.indexOf(prompt) < imagePrompts.length - 1) {
      await sleep(500);
    }
  }

  return results;
}
