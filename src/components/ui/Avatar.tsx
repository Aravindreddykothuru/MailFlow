import React from 'react';
import { cn } from '../../lib/cn';
import { avatarColor, initials } from '../../lib/format';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** Name or email used for the initials and the deterministic colour. */
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-10 w-10 text-sm'
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)} />);


  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: avatarColor(name) }}>
      
      {initials(name)}
    </span>);

}