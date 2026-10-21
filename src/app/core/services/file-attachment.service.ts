import { Injectable } from '@angular/core';

/** Supported categories that the service can handle. */
export type AttachmentCategory = 'text' | 'code' | 'pdf';

/** Metadata + extracted content for a single attached file. */
export interface AttachedFile {
  /** Display name (original filename). */
  name: string;
  /** MIME type reported by the browser. */
  mimeType: string;
  /** Detected category used for UI icon / label. */
  category: AttachmentCategory;
  /** File size in bytes (before reading). */
  size: number;
  /** Plain-text content extracted from the file — injected into the model prompt. */
  content: string;
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Maximum file size accepted (bytes). Default: 10 MB. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Extensions considered plain-text source code.
 * Read as UTF-8 text.
 */
const CODE_EXTENSIONS: readonly string[] = [
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'kts',
  'c', 'cpp', 'h', 'hpp', 'cs', 'swift',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'jsonc', 'yaml', 'yml', 'toml', 'xml',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'vue', 'svelte', 'astro',
  'md', 'mdx', 'rst',
  'r', 'matlab', 'm', 'lua', 'dart', 'ex', 'exs',
  'tf', 'hcl', 'dockerfile',
];

const TEXT_EXTENSIONS: readonly string[] = ['txt', 'log', 'csv', 'tsv', 'env'];

const PDF_MIME = 'application/pdf';
const PDF_EXT = 'pdf';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class FileAttachmentService {

  /**
   * Validates and reads one or more files selected by the user.
   * Returns successfully processed files; failures are collected in `errors`.
   */
  async readFiles(files: FileList | File[]): Promise<{ ok: AttachedFile[]; errors: string[] }> {
    const fileArray = Array.from(files);
    const ok: AttachedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validation = this.validate(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.reason}`);
        continue;
      }

      try {
        const attached = await this.processFile(file);
        ok.push(attached);
      } catch (err: any) {
        errors.push(`${file.name}: ${err?.message ?? 'Unknown error'}`);
      }
    }

    return { ok, errors };
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  validate(file: File): { valid: boolean; reason: string } {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, reason: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit` };
    }

    const ext = this.getExtension(file.name);
    const isPdf = file.type === PDF_MIME || ext === PDF_EXT;
    const isText = TEXT_EXTENSIONS.includes(ext);
    const isCode = CODE_EXTENSIONS.includes(ext);
    const isPlainText = file.type.startsWith('text/');

    if (!isPdf && !isText && !isCode && !isPlainText) {
      return { valid: false, reason: `Unsupported file type (.${ext || '?'})` };
    }

    return { valid: true, reason: '' };
  }

  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------

  private async processFile(file: File): Promise<AttachedFile> {
    const ext = this.getExtension(file.name);
    const isPdf = file.type === PDF_MIME || ext === PDF_EXT;

    let content: string;
    let category: AttachmentCategory;

    if (isPdf) {
      content = await this.extractPdfText(file);
      category = 'pdf';
    } else if (CODE_EXTENSIONS.includes(ext)) {
      content = await this.readAsText(file);
      category = 'code';
    } else {
      content = await this.readAsText(file);
      category = 'text';
    }

    return {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      category,
      size: file.size,
      content,
    };
  }

  // -------------------------------------------------------------------------
  // Readers
  // -------------------------------------------------------------------------

  private readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * PDF text extraction.
   * Tries to use PDF.js if available (npm package or CDN global).
   * Falls back to a placeholder message the model can act on.
   */
  private async extractPdfText(file: File): Promise<string> {
    try {
      const pdfjsLib = await this.loadPdfJs();
      if (!pdfjsLib) {
        return `[PDF file attached: ${file.name} — PDF.js not available, text cannot be extracted]`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const textParts: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[])
          .map((item: any) => item.str)
          .join(' ');
        textParts.push(`[Page ${pageNum}]\n${pageText}`);
      }

      return textParts.join('\n\n');
    } catch {
      return `[PDF file attached: ${file.name} — text extraction failed. The file may be image-based or encrypted.]`;
    }
  }

  /**
   * Resolves the PDF.js library:
   * 1. Global `window.pdfjsLib` (CDN)
   * 2. npm package `pdfjs-dist`
   * 3. null (not available)
   */
  private async loadPdfJs(): Promise<any | null> {
    if (typeof (window as any)['pdfjsLib'] !== 'undefined') {
      return (window as any)['pdfjsLib'];
    }

    try {
      // Use Function() to construct the import at runtime so neither TypeScript,
      // esbuild nor Vite can statically resolve it. This is the canonical approach
      // for truly optional peer dependencies that may not be installed.
      const dynamicImport = new Function('m', 'return import(m)');
      const mod = await dynamicImport('pdfjs-dist');
      if (mod.GlobalWorkerOptions && !mod.GlobalWorkerOptions.workerSrc) {
        mod.GlobalWorkerOptions.workerSrc =
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.js`;
      }
      return mod;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private getExtension(filename: string): string {
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Formats extracted content from all attached files into a context block
   * that is prepended to the user's message before sending to the model.
   */
  buildFileContext(files: AttachedFile[]): string {
    if (files.length === 0) return '';

    const blocks = files.map((f) => {
      const header = `--- FILE: ${f.name} (${this.humanSize(f.size)}) ---`;
      const footer = `--- END OF ${f.name} ---`;
      return `${header}\n${f.content}\n${footer}`;
    });

    return `[ATTACHED FILES]\n\n${blocks.join('\n\n')}\n\n[END OF ATTACHED FILES]\n\n`;
  }

  /** Converts bytes to a human-readable size string. */
  humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /** Returns a human-friendly label for the category. */
  categoryLabel(cat: AttachmentCategory): string {
    switch (cat) {
      case 'pdf': return 'PDF';
      case 'code': return 'Code';
      default: return 'Text';
    }
  }

  /** Returns an emoji icon for the category. */
  categoryIcon(cat: AttachmentCategory): string {
    switch (cat) {
      case 'pdf': return '📄';
      case 'code': return '💻';
      default: return '📝';
    }
  }
}
