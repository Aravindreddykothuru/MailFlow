import React from 'react';
import { CheckIcon, UsersIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { ACCEPTED_RECIPIENT_TYPES } from '../../lib/recipients';
import { pluralize } from '../../lib/format';
import type { RecipientFileState } from '../../hooks/useRecipientFile';

export interface RecipientUploadSectionProps {
  file: RecipientFileState;
  error?: string;
}

export function RecipientUploadSection({ file, error }: RecipientUploadSectionProps) {
  const parsed = file.parsed;

  return (
    <Card as="section">
      <CardHeader
        title="Recipients"
        icon={<UsersIcon className="h-4 w-4" strokeWidth={1.75} />} />
      
      <div className="p-5 sm:p-6">
        <FileUpload
          id="recipient-file"
          label="Recipient list file"
          accept={ACCEPTED_RECIPIENT_TYPES}
          status={file.status}
          progress={file.progress}
          fileName={file.fileName}
          fileSize={file.fileSize}
          error={file.error}
          idleTitle="Drag & drop your CSV or TXT lead file here"
          idleHint="or click to browse — one email address per row"
          onFileSelect={(selected) => void file.selectFile(selected)}
          onClear={file.clear}
          summary={
          parsed ?
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-border/60 px-3 py-1 text-xs font-semibold text-success-text">
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                {parsed.validEmails.length} valid email{' '}
                {pluralize(parsed.validEmails.length, 'address', 'addresses')} detected
              </span> :
          undefined
          } />
        

        {parsed && (parsed.invalidRows > 0 || parsed.duplicatesRemoved > 0) &&
        <p className="mt-3 text-xs text-ink-muted">
            {parsed.duplicatesRemoved > 0 &&
          <>
                {parsed.duplicatesRemoved} duplicate{' '}
                {pluralize(parsed.duplicatesRemoved, 'address', 'addresses')} removed.{' '}
              </>
          }
            {parsed.invalidRows > 0 &&
          <>
                {parsed.invalidRows} {pluralize(parsed.invalidRows, 'row')} skipped — no valid
                address found.
              </>
          }
          </p>
        }

        {error &&
        <p className="mt-3 text-xs text-danger" role="alert">
            {error}
          </p>
        }
      </div>
    </Card>);

}