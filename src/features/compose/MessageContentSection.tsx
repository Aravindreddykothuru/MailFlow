import React from 'react';
import { BoldIcon, ItalicIcon, LinkIcon, PenLineIcon, UnderlineIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import type { ComposeField, ComposeValues } from '../../hooks/useComposeForm';

export interface MessageContentSectionProps {
  values: ComposeValues;
  onChange: (field: ComposeField, value: string) => void;
  onBlur: (field: ComposeField) => void;
  visibleError: (field: ComposeField) => string | undefined;
}

const TOOLBAR_ACTIONS = [
{ label: 'Bold', icon: BoldIcon },
{ label: 'Italic', icon: ItalicIcon },
{ label: 'Underline', icon: UnderlineIcon },
{ label: 'Insert link', icon: LinkIcon }] as
const;

export function MessageContentSection({
  values,
  onChange,
  onBlur,
  visibleError
}: MessageContentSectionProps) {
  return (
    <Card as="section">
      <CardHeader
        title="Message Content"
        icon={<PenLineIcon className="h-4 w-4" strokeWidth={1.75} />} />
      
      <div className="space-y-4 p-5 sm:p-6">
        <Input
          id="subject"
          label="Subject line"
          required
          placeholder="Enter an engaging subject…"
          value={values.subject}
          error={visibleError('subject')}
          onChange={(event) => onChange('subject', event.target.value)}
          onBlur={() => onBlur('subject')} />
        

        <Textarea
          id="body"
          label="Email body"
          required
          placeholder="Type your message here…"
          value={values.body}
          error={visibleError('body')}
          onChange={(event) => onChange('body', event.target.value)}
          onBlur={() => onBlur('body')}
          toolbar={TOOLBAR_ACTIONS.map(({ label, icon: Icon }) =>
          <button
            key={label}
            type="button"
            aria-label={label}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 ease-out hover:bg-white hover:text-ink">
            
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )} />
        
      </div>
    </Card>);

}