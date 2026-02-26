import Tesseract from 'tesseract.js';

export const processDocument = async (file: File, onProgress?: (percent: number) => void) => {
  // If it's a text file, read it directly
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // If it's an image or PDF (Tesseract can handle some images)
  // For a real app, we'd use a PDF library like pdfjs-dist
  try {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    return result.data.text;
  } catch (err) {
    console.error('Error processing document:', err);
    throw new Error('Failed to process document. Please try a text file.');
  }
};

/**
 * Split text into chunks for embedding.
 */
export const chunkText = (text: string, chunkSize: number = 1000, overlap: number = 200) => {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
};
