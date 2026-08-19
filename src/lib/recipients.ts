import type { ParsedRecipientFile } from '../types/email';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export const ACCEPTED_RECIPIENT_TYPES = '.csv,.txt,text/csv,text/plain';
export const MAX_RECIPIENT_FILE_BYTES = 5 * 1024 * 1024;

export class RecipientFileError extends Error {}

export function validateRecipientFile(file: File): void {
  const name = file.name.toLowerCase();
  const hasAllowedExtension = name.endsWith('.csv') || name.endsWith('.txt');
  if (!hasAllowedExtension) {
    throw new RecipientFileError('Unsupported file type. Upload a .csv or .txt file.');
  }
  if (file.size > MAX_RECIPIENT_FILE_BYTES) {
    throw new RecipientFileError('File is too large. The maximum size is 5 MB.');
  }
  if (file.size === 0) {
    throw new RecipientFileError('That file is empty. Upload a list containing email addresses.');
  }
}

/** Extracts unique email addresses from raw CSV or plain-text content. */
export function extractEmails(content: string): Pick<
  ParsedRecipientFile,
  'validEmails' | 'invalidRows' | 'duplicatesRemoved'>
{
  const rows = content.
  split(/\r?\n/).
  map((row) => row.trim()).
  filter((row) => row.length > 0);

  const seen = new Set<string>();
  let invalidRows = 0;
  let duplicatesRemoved = 0;

  rows.forEach((row, index) => {
    const matches = row.match(EMAIL_PATTERN);
    if (!matches) {
      // Ignore a header row that legitimately contains no address.
      const looksLikeHeader = index === 0 && /email|address|recipient/i.test(row);
      if (!looksLikeHeader) invalidRows += 1;
      return;
    }
    matches.forEach((match) => {
      const email = match.toLowerCase();
      if (seen.has(email)) {
        duplicatesRemoved += 1;
        return;
      }
      seen.add(email);
    });
  });

  return { validEmails: [...seen], invalidRows, duplicatesRemoved };
}

/** Reads and parses the file entirely in the browser. */
export async function parseRecipientFile(file: File): Promise<ParsedRecipientFile> {
  validateRecipientFile(file);
  const content = await file.text();
  const parsed = extractEmails(content);

  if (parsed.validEmails.length === 0) {
    throw new RecipientFileError(
      'No valid email addresses found. Check that the file has one address per row.'
    );
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    ...parsed
  };
}