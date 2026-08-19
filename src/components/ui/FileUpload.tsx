import React, { useRef, useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, FileTextIcon, UploadCloudIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { formatFileSize } from '../../lib/format';

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface FileUploadProps {
  id: string;
  /** Visually hidden label for the underlying input. */
  label: string;
  accept: string;
  status: FileUploadStatus;
  /** 0–100 while status is "uploading". */
  progress?: number;
  fileName?: string;
  fileSize?: number;
  /** Parsed result summary shown on success (e.g. detected address count). */
  summary?: React.ReactNode;
  error?: string;
  idleTitle: string;
  idleHint: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export function FileUpload({
  id,
  label,
  accept,
  status,
  progress = 0,
  fileName,
  fileSize,
  summary,
  error,
  idleTitle,
  idleHint,
  onFileSelect,
  onClear
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelect(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-150 ease-out sm:p-8',
        isDragOver && 'border-primary bg-primary-soft',
        !isDragOver && status === 'success' && 'border-success-border bg-success-bg',
        !isDragOver && status === 'error' && 'border-danger-border bg-danger-bg',
        !isDragOver && (status === 'idle' || status === 'uploading') && 'border-line bg-white',
        'focus-within:border-primary'
      )}>
      
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
        aria-describedby={`${id}-status`} />
      

      {status === 'uploading' ?
      <div className="w-full max-w-xs">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-ink">
            <FileTextIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="truncate">{fileName ?? 'Reading file…'}</span>
          </div>
          <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-line-light"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress">
          
            <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          
          </div>
          <p className="mt-2 text-xs text-ink-placeholder">
            Parsing recipients… {Math.round(progress)}%
          </p>
        </div> :
      status === 'success' ?
      <>
          <CheckCircle2Icon className="h-8 w-8 text-success" aria-hidden="true" />
          <p className="max-w-full truncate text-sm font-medium text-ink">{fileName}</p>
          {typeof fileSize === 'number' &&
        <p className="text-xs text-ink-placeholder">{formatFileSize(fileSize)}</p>
        }
          {summary}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <label htmlFor={id} className="cursor-pointer">
              <span className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink-muted transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-ink">
                Replace file
              </span>
            </label>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          </div>
        </> :
      status === 'error' ?
      <>
          <AlertCircleIcon className="h-8 w-8 text-danger" aria-hidden="true" />
          <p className="text-sm font-medium text-ink">Couldn’t use that file</p>
          <p className="max-w-sm text-xs text-danger">{error}</p>
          <label htmlFor={id} className="mt-2 cursor-pointer">
            <span className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink-muted transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-ink">
              Choose another file
            </span>
          </label>
        </> :

      <label htmlFor={id} className="flex cursor-pointer flex-col items-center gap-2">
          <UploadCloudIcon className="h-8 w-8 text-ink-placeholder" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-secondary">{idleTitle}</span>
          <span className="text-xs text-ink-placeholder">{idleHint}</span>
          <span className="sr-only">{label}</span>
        </label>
      }

      <p id={`${id}-status`} className="sr-only" role="status">
        {status === 'success' ?
        `${fileName} uploaded` :
        status === 'error' ?
        error ?? 'Upload failed' :
        status === 'uploading' ?
        'Parsing file' :
        'No file selected'}
      </p>
    </div>);

}