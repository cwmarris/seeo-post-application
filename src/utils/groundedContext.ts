export interface GroundedDocSelection {
  id: string;
  name: string;
  mimeType: string;
  textContent: string;
}

export const MAX_GROUNDED_FILE_BYTES = 512 * 1024;

export const ALLOWED_GROUNDED_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
]);

export const ALLOWED_GROUNDED_EXTENSIONS = new Set(['.txt', '.csv']);

export function isAllowedGroundedMime(mimeType: string, fileName: string): boolean {
  const normalized = mimeType.trim().toLowerCase();
  if (ALLOWED_GROUNDED_MIME_TYPES.has(normalized)) return true;

  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
  return ALLOWED_GROUNDED_EXTENSIONS.has(ext);
}

export function buildGroundedTextFromSelection(
  selectedDocs: GroundedDocSelection[],
  manualPaste: string
): string {
  const blocks: string[] = [];

  for (const doc of selectedDocs) {
    const body = doc.textContent.trim();
    if (!body) continue;
    blocks.push(`--- ${doc.name} ---\n${body}`);
  }

  const manual = manualPaste.trim();
  if (manual) {
    blocks.push(`--- Manual context ---\n${manual}`);
  }

  return blocks.join('\n\n');
}

export function toggleSelectedDocId(selectedIds: string[], docId: string): string[] {
  if (selectedIds.includes(docId)) {
    return selectedIds.filter((id) => id !== docId);
  }
  return [...selectedIds, docId];
}

export async function readGroundedFileAsText(file: File): Promise<string> {
  if (file.size > MAX_GROUNDED_FILE_BYTES) {
    throw new Error(`File exceeds ${Math.round(MAX_GROUNDED_FILE_BYTES / 1024)}KB limit`);
  }

  if (!isAllowedGroundedMime(file.type, file.name)) {
    throw new Error('Only .txt and .csv files are supported. PDF upload is not enabled yet.');
  }

  return file.text();
}
