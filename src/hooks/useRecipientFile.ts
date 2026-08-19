import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileUploadStatus } from '../components/ui/FileUpload';
import { RecipientFileError, parseRecipientFile, validateRecipientFile } from '../lib/recipients';
import type { ParsedRecipientFile } from '../types/email';

export interface RecipientFileState {
  status: FileUploadStatus;
  progress: number;
  fileName?: string;
  fileSize?: number;
  parsed: ParsedRecipientFile | null;
  error?: string;
  selectFile: (file: File) => Promise<void>;
  clear: () => void;
}

/** Reads and parses the recipient list entirely in the browser. */
export function useRecipientFile(): RecipientFileState {
  const [status, setStatus] = useState<FileUploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [fileMeta, setFileMeta] = useState<{name: string;size: number;} | null>(null);
  const [parsed, setParsed] = useState<ParsedRecipientFile | null>(null);
  const [error, setError] = useState<string | undefined>();
  const timer = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  const clear = useCallback(() => {
    stopTimer();
    setStatus('idle');
    setProgress(0);
    setFileMeta(null);
    setParsed(null);
    setError(undefined);
  }, [stopTimer]);

  const selectFile = useCallback(
    async (file: File) => {
      stopTimer();
      setParsed(null);
      setError(undefined);
      setFileMeta({ name: file.name, size: file.size });

      try {
        validateRecipientFile(file);
      } catch (caught) {
        setStatus('error');
        setError(
          caught instanceof RecipientFileError ? caught.message : 'That file could not be read.'
        );
        return;
      }

      setStatus('uploading');
      setProgress(8);
      timer.current = window.setInterval(() => {
        setProgress((current) => current >= 90 ? 90 : current + 12);
      }, 90);

      try {
        const result = await parseRecipientFile(file);
        stopTimer();
        setProgress(100);
        setParsed(result);
        setStatus('success');
      } catch (caught) {
        stopTimer();
        setProgress(0);
        setStatus('error');
        setError(
          caught instanceof RecipientFileError ?
          caught.message :
          'We couldn’t parse that file. Upload a .csv or .txt list of addresses.'
        );
      }
    },
    [stopTimer]
  );

  return {
    status,
    progress,
    fileName: fileMeta?.name,
    fileSize: fileMeta?.size,
    parsed,
    error,
    selectFile,
    clear
  };
}