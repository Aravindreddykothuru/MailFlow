import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarDaysIcon, LayoutGridIcon, PlusIcon, SendIcon, SettingsIcon, BoxIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { MailFlowLogo } from "../brand/MailFlowLogo";
import { UserMenu } from "./UserMenu";
import { User } from "../../types/user";
export const NAV_ITEMS = [{
  to: '/dashboard',
  label: 'Dashboard',
  icon: LayoutGridIcon
}, {
  to: '/scheduled',
  label: 'Scheduled Emails',
  icon: CalendarDaysIcon
}, {
  to: '/sent',
  label: 'Sent Emails',
  icon: SendIcon
}] as const;
export interface SidebarProps {
  user: User;
  onLogout: () => void;
  onNavigate?: () => void;
  onCompose: () => void;
}
export function Sidebar({
  user,
  onLogout,
  onNavigate,
  onCompose
}: SidebarProps) {
  return <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-line-light bg-surface">
      <div className="border-b border-line-light px-5 pb-5 pt-6">
        <MailFlowLogo subtitle="Enterprise Tier" />
      </div>

      <div className="px-4 py-4">
        <button type="button" onClick={() => {
        onCompose();
        onNavigate?.();
      }} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover">
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          Compose New
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3 pb-4">
        {NAV_ITEMS.map(({
        to,
        label,
        icon: Icon
      }) => <NavLink key={to} to={to} onClick={onNavigate} className={({
        isActive
      }) => cn('flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out', isActive ? 'bg-primary-soft text-primary' : 'text-ink-secondary hover:bg-gray-50 hover:text-ink')}>
            {({
          isActive
        }) => <>
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-ink-placeholder')} strokeWidth={1.75} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </>}
          </NavLink>)}
      </nav>

      <div className="space-y-0.5 border-t border-line-light px-3 py-3">
        {[{
        label: 'Help',
        icon: BoxIcon
      }, {
        label: 'Settings',
        icon: SettingsIcon
      }].map(({
        label,
        icon: Icon
      }) => <button key={label} type="button" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink-secondary transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-ink">
            <Icon className="h-4 w-4 text-ink-placeholder" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </button>)}
      </div>

      <div className="border-t border-line-light p-3">
        <UserMenu user={user} onLogout={onLogout} variant="sidebar" />
      </div>
    </aside>;
}