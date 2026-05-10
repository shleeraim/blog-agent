import { GoogleGenAI } from '@google/genai';
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: params.aspectRatio === '16:9' ? '16:9' : '1:1',
      },
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) {
      return { success: false, error: '이미지 데이터가 응답에 없습니다.' };
    }

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    return { success: true, dataUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function generateImagesForDraft(imagePrompts: ImagePrompt[]): Promise<GeneratedImage[]> {
  const results = await Promise.all(
    imagePrompts.map(async (prompt) => {
      const result = await generateImage({
        prompt: prompt.prompt,
        aspectRatio: prompt.aspectRatio,
        type: prompt.type,
      });

      if (result.success && result.dataUrl) {
        return {
          type: prompt.type,
          aspectRatio: prompt.aspectRatio,
          url: result.dataUrl,
          altText: prompt.altText,
          insertAfterSection: prompt.insertAfterSection,
        } as GeneratedImage;
      }
      return null;
    })
  );

  return results.filter((r): r is GeneratedImage => r !== null);
}
