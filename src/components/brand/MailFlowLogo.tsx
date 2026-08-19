import React from 'react';
import { cn } from '../../lib/cn';

export interface MailGlyphProps {
  className?: string;
  width?: number;
  height?: number;
}

export function MailGlyph({ className, width = 16, height = 13 }: MailGlyphProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 22"
      fill="none"
      className={className}
      aria-hidden="true">
      
      <path
        d="M25.333 0H2.667A2.667 2.667 0 000 2.667v16A2.667 2.667 0 002.667 21.333h22.666A2.667 2.667 0 0028 18.667v-16A2.667 2.667 0 0025.333 0zm0 5.333L14 12 2.667 5.333V2.667L14 9.333l11.333-6.666v2.666z"
        fill="currentColor" />
      
    </svg>);

}

export interface MailFlowLogoProps {
  /** "brand" = blue mark on light surfaces, "inverse" = translucent on the blue panel. */
  tone?: 'brand' | 'inverse';
  className?: string;
  subtitle?: string;
}

export function MailFlowLogo({ tone = 'brand', className, subtitle }: MailFlowLogoProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md',
            tone === 'brand' ?
            'h-8 w-8 bg-primary text-white' :
            'h-10 w-10 border border-white/30 bg-white/20 text-white backdrop-blur-sm'
          )}>
          
          <MailGlyph
            width={tone === 'brand' ? 16 : 20}
            height={tone === 'brand' ? 13 : 16} />
          
        </span>
        <span
          className={cn(
            'font-bold tracking-tight',
            tone === 'brand' ? 'text-lg text-primary' : 'text-xl text-white'
          )}>
          
          MailFlow
        </span>
      </div>
      {subtitle && <p className="ml-0.5 mt-1 text-[11px] text-ink-placeholder">{subtitle}</p>}
    </div>);

}