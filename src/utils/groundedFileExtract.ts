import mammoth from 'mammoth';

let pdfWorkerReady: Promise<typeof import('pdfjs-dist')> | null = null;

async function loadPdfJs() {
  if (!pdfWorkerReady) {
    pdfWorkerReady = (async () => {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    })();
  }
  return pdfWorkerReady;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  const combined = pageTexts.join('\n\n').trim();
  if (!combined) {
    throw new Error(
      'No extractable text in this PDF. Scanned or image-only PDFs are not supported — use a text-based PDF or upload the page as JPEG/PNG.'
    );
  }

  return combined;
}

export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error('No text found in this Word document.');
  }

  if (result.messages.length > 0 && import.meta.env.DEV) {
    console.warn('[grounded] docx extraction warnings', result.messages);
  }

  return text;
}
