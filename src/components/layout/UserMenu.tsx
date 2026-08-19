import React from 'react';
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownHeader, DropdownItem } from '../ui/Dropdown';
import type { User } from '../../types/user';

export interface UserMenuProps {
  user: User;
  onLogout: () => void;
  /** "sidebar" is the full-width footer row, "header" is the compact top-bar trigger. */
  variant?: 'sidebar' | 'header';
}

export function UserMenu({ user, onLogout, variant = 'header' }: UserMenuProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <Dropdown
      label={`Account menu for ${user.name}`}
      align={isSidebar ? 'left' : 'right'}
      placement={isSidebar ? 'top' : 'bottom'}
      triggerClassName={
      isSidebar ?
      'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-gray-50' :
      'flex items-center gap-2.5 rounded-md py-1 pl-1 pr-1 hover:bg-gray-50'
      }
      menuClassName={isSidebar ? 'w-full min-w-0' : undefined}
      trigger={
      isSidebar ?
      <>
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-ink">{user.name}</span>
              <span className="block truncate text-[11px] text-ink-placeholder">{user.email}</span>
            </span>
            <ChevronsUpDownIcon
          className="h-3.5 w-3.5 shrink-0 text-ink-placeholder"
          aria-hidden="true" />
        
          </> :

      <>
            <span className="hidden text-right sm:block">
              <span className="block text-xs font-semibold leading-tight text-ink">{user.name}</span>
              <span className="block text-[11px] leading-tight text-ink-placeholder">
                {user.email}
              </span>
            </span>
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
          </>

      }>
      
      {(close) =>
      <>
          <DropdownHeader title={user.name} subtitle={user.email} />
          <DropdownItem
          tone="danger"
          icon={<LogOutIcon className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            close();
            onLogout();
          }}>
          
            Sign out
          </DropdownItem>
        </>
      }
    </Dropdown>);

}