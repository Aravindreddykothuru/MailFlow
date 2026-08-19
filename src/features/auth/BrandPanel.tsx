import React, { useState } from 'react';
import {
  BarChart3Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  StarIcon,
  ZapIcon } from
'lucide-react';
import { cn } from '../../lib/cn';
import { avatarColor, initials } from '../../lib/format';
import { MailFlowLogo } from '../../components/brand/MailFlowLogo';
import { brandStats, featurePills, testimonials, type FeaturePill } from '../../data/loginContent';

const PILL_ICONS: Record<FeaturePill['icon'], React.ComponentType<{className?: string;}>> = {
  calendar: CalendarDaysIcon,
  chart: BarChart3Icon,
  bolt: ZapIcon,
  list: ClipboardListIcon
};

/** Marketing / social-proof panel shown beside the sign-in form on tablet and up. */
export function BrandPanel() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonial = testimonials[activeTestimonial];

  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex md:w-[52%]"
      style={{ background: 'linear-gradient(140deg, #002f82 0%, #004ac6 45%, #0062ff 100%)' }}>
      
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
        aria-hidden="true" />
      

      <div className="relative z-10">
        <MailFlowLogo tone="inverse" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center py-10">
        <div className="mb-8">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-200">
            Enterprise Email Platform
          </p>
          <h2 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white">
            Schedule emails
            <br />
            with surgical
            <br />
            precision.
          </h2>
          <p className="max-w-xs text-base leading-relaxed text-blue-200">
            Upload your lead list, set throttle rates, and let MailFlow handle delivery —
            automatically, reliably, at scale.
          </p>
        </div>

        <ul className="mb-10 flex flex-wrap gap-2">
          {featurePills.map((pill) => {
            const Icon = PILL_ICONS[pill.icon];
            return (
              <li
                key={pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {pill.label}
              </li>);

          })}
        </ul>

        <dl className="grid grid-cols-3 gap-4">
          {brandStats.map((stat) =>
          <div key={stat.label}>
              <dd className="text-2xl font-bold tabular-nums text-white">{stat.value}</dd>
              <dt className="mt-0.5 text-xs text-blue-300">{stat.label}</dt>
            </div>
          )}
        </dl>
      </div>

      <figure className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
        <div className="mb-3 flex gap-1" aria-label="Rated 5 out of 5">
          {Array.from({ length: 5 }).map((_, index) =>
          <StarIcon key={index} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
          )}
        </div>
        <blockquote className="mb-4 text-sm leading-relaxed text-white/90">
          “{testimonial.text}”
        </blockquote>
        <div className="flex items-center justify-between gap-4">
          <figcaption className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: avatarColor(testimonial.name) }}
              aria-hidden="true">
              
              {initials(testimonial.name)}
            </span>
            <span>
              <span className="block text-xs font-semibold text-white">{testimonial.name}</span>
              <span className="block text-[11px] text-blue-300">{testimonial.role}</span>
            </span>
          </figcaption>
          <div className="flex gap-1.5">
            {testimonials.map((item, index) =>
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveTestimonial(index)}
              aria-label={`Show testimonial from ${item.name}`}
              aria-current={index === activeTestimonial}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out',
                index === activeTestimonial ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
              )} />

            )}
          </div>
        </div>
      </figure>
    </div>);

}