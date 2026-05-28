import { extractGroundedImageText, fileToBase64DataUrl } from './groundedImageApi';

export interface GroundedDocSelection {
  id: string;
  name: string;
  mimeType: string;
  textContent: string;
}

export type GroundedFileKind = 'text' | 'image' | 'pdf' | 'docx' | 'doc';

export const MAX_GROUNDED_TEXT_BYTES = 512 * 1024;
export const MAX_GROUNDED_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_GROUNDED_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_GROUNDED_DOCX_BYTES = 10 * 1024 * 1024;

/** @deprecated Use per-kind limits via getMaxGroundedFileBytes */
export const MAX_GROUNDED_FILE_BYTES = MAX_GROUNDED_TEXT_BYTES;

export const ALLOWED_GROUNDED_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

export const ALLOWED_GROUNDED_EXTENSIONS = new Set([
  '.txt',
  '.csv',
  '.pdf',
  '.docx',
  '.doc',
  '.jpeg',
  '.jpg',
  '.png',
]);

const EXTENSION_KIND: Record<string, GroundedFileKind> = {
  '.txt': 'text',
  '.csv': 'text',
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'doc',
  '.jpeg': 'image',
  '.jpg': 'image',
  '.png': 'image',
};

const MIME_KIND: Record<string, GroundedFileKind> = {
  'text/plain': 'text',
  'text/csv': 'text',
  'application/csv': 'text',
  'text/comma-separated-values': 'text',
  'application/vnd.ms-excel': 'text',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
};

export function getGroundedFileExtension(fileName: string): string {
  if (!fileName.includes('.')) return '';
  return fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
}

export function getGroundedFileKind(fileName: string, mimeType: string): GroundedFileKind | null {
  const ext = getGroundedFileExtension(fileName);
  if (ext && EXTENSION_KIND[ext]) return EXTENSION_KIND[ext];

  const normalized = mimeType.trim().toLowerCase();
  if (normalized && MIME_KIND[normalized]) return MIME_KIND[normalized];

  return null;
}

export function isAllowedGroundedMime(mimeType: string, fileName: string): boolean {
  return getGroundedFileKind(fileName, mimeType) !== null;
}

export function getMaxGroundedFileBytes(kind: GroundedFileKind): number {
  switch (kind) {
    case 'image':
      return MAX_GROUNDED_IMAGE_BYTES;
    case 'pdf':
      return MAX_GROUNDED_PDF_BYTES;
    case 'docx':
    case 'doc':
      return MAX_GROUNDED_DOCX_BYTES;
    default:
      return MAX_GROUNDED_TEXT_BYTES;
  }
}

export function formatGroundedSizeLimit(kind: GroundedFileKind): string {
  const bytes = getMaxGroundedFileBytes(kind);
  if (bytes >= 1024 * 1024) return `${bytes / (1024 * 1024)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export const GROUNDED_SUPPORTED_TYPES_LABEL =
  'TXT, CSV, PDF, Word (.docx), JPEG, PNG';

export const GROUNDED_ACCEPT_ATTRIBUTE =
  '.txt,.csv,.pdf,.docx,.doc,.jpeg,.jpg,.png,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/jpeg,image/png';

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

async function readGroundedTextFile(file: File): Promise<string> {
  return file.text();
}

async function readGroundedImageFile(file: File): Promise<string> {
  const dataUrl = await fileToBase64DataUrl(file);
  const result = await extractGroundedImageText({
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    imageBase64: dataUrl,
  });
  return result.textContent;
}

export async function readGroundedFileAsText(file: File): Promise<string> {
  const kind = getGroundedFileKind(file.name, file.type);
  if (!kind) {
    throw new Error(
      `Unsupported file type. Supported: ${GROUNDED_SUPPORTED_TYPES_LABEL}. Legacy .doc is not supported — save as .docx.`
    );
  }

  if (kind === 'doc') {
    throw new Error(
      'Legacy Word .doc files are not supported. Open the file in Word and save as .docx, or export to PDF.'
    );
  }

  const maxBytes = getMaxGroundedFileBytes(kind);
  if (file.size > maxBytes) {
    throw new Error(
      `${file.name} exceeds the ${formatGroundedSizeLimit(kind)} limit for ${kind} files`
    );
  }

  switch (kind) {
    case 'text':
      return readGroundedTextFile(file);
    case 'image':
      return readGroundedImageFile(file);
    case 'pdf': {
      const { extractPdfText } = await import('./groundedFileExtract');
      return extractPdfText(file);
    }
    case 'docx': {
      const { extractDocxText } = await import('./groundedFileExtract');
      return extractDocxText(file);
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
