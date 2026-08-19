import React from 'react';
import { CalendarIcon, ClockIcon, GaugeIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  delayOptions,
  type ComposeErrors,
  type ComposeField,
  type ComposeValues } from
'../../hooks/useComposeForm';

export interface SchedulingSectionProps {
  values: ComposeValues;
  onChange: (field: ComposeField, value: string) => void;
  onBlur: (field: ComposeField) => void;
  visibleError: (field: ComposeField) => string | undefined;
  errors: ComposeErrors;
}

export function SchedulingSection({
  values,
  onChange,
  onBlur,
  visibleError
}: SchedulingSectionProps) {
  return (
    <Card as="section">
      <CardHeader
        title="Scheduling & Throttling"
        icon={<ClockIcon className="h-4 w-4" strokeWidth={1.75} />} />
      
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <Input
          id="startAt"
          type="datetime-local"
          label="Start date & time"
          required
          value={values.startAt}
          error={visibleError('startAt')}
          icon={<CalendarIcon className="h-4 w-4" strokeWidth={1.75} />}
          onChange={(event) => onChange('startAt', event.target.value)}
          onBlur={() => onBlur('startAt')} />
        

        <Select
          id="delaySeconds"
          label="Delay between emails"
          required
          value={values.delaySeconds}
          error={visibleError('delaySeconds')}
          options={delayOptions}
          onChange={(event) => onChange('delaySeconds', event.target.value)}
          onBlur={() => onBlur('delaySeconds')} />
        

        <Input
          id="hourlyLimit"
          type="number"
          min={1}
          max={1000}
          label="Hourly limit"
          required
          value={values.hourlyLimit}
          error={visibleError('hourlyLimit')}
          icon={<GaugeIcon className="h-4 w-4" strokeWidth={1.75} />}
          onChange={(event) => onChange('hourlyLimit', event.target.value)}
          onBlur={() => onBlur('hourlyLimit')} />
        
      </div>
    </Card>);

}