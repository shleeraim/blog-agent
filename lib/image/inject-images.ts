import type { GeneratedImage } from '@/lib/types';

export function injectImagesIntoContent(
  content: string,
  images: GeneratedImage[]
): string {
  if (!images || images.length === 0) return content;

  const lines = content.split('\n');
  const result: string[] = [];

  const headerImages = images.filter((img) => img.insertAfterSection === 'header');
  // key: insertAfterSection text → images waiting to be inserted
  const pending = new Map<string, GeneratedImage[]>();
  for (const img of images) {
    if (img.insertAfterSection !== 'header') {
      const arr = pending.get(img.insertAfterSection) ?? [];
      pending.set(img.insertAfterSection, [...arr, img]);
    }
  }

  let firstH2Seen = false;

  for (const line of lines) {
    const isH2 = line.startsWith('## ');

    // Header thumbnails: inject right before the first ## heading
    if (isH2 && !firstH2Seen && headerImages.length > 0) {
      for (const img of headerImages) {
        result.push(`![${img.altText}](${img.url})`);
        result.push('');
      }
    }
    if (isH2) firstH2Seen = true;

    result.push(line);

    // Section images: inject after the matching ## heading
    if (isH2) {
      const sectionTitle = line.slice(3).trim();
      // Try exact match first
      let matched = pending.get(sectionTitle);
      if (!matched) {
        // Partial match
        for (const [key, imgs] of pending.entries()) {
          if (sectionTitle.includes(key) || key.includes(sectionTitle)) {
            matched = imgs;
            pending.delete(key);
            break;
          }
        }
      } else {
        pending.delete(sectionTitle);
      }
      if (matched) {
        for (const img of matched) {
          result.push('');
          result.push(`![${img.altText}](${img.url})`);
          result.push('');
        }
      }
    }
  }

  // Header images: no ## found → prepend to top
  if (!firstH2Seen && headerImages.length > 0) {
    const prepend: string[] = [];
    for (const img of headerImages) {
      prepend.push(`![${img.altText}](${img.url})`);
      prepend.push('');
    }
    return [...prepend, ...result].join('\n');
  }

  // Unmatched section images → append at end
  for (const imgs of pending.values()) {
    for (const img of imgs) {
      result.push('');
      result.push(`![${img.altText}](${img.url})`);
      result.push('');
    }
  }

  return result.join('\n');
}
