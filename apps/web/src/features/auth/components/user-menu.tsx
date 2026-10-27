'use client';

import { ChevronDownIcon, LogOutIcon, UserRoundIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { toast } from '@/lib/toast';

import { useLogout } from '../api/mutations';
import type { SessionUser } from '../schemas';

/** Avatar + name in the header; the menu holds the account details, the account page and the logout. */
export function UserMenu({ user }: { user: SessionUser }) {
  const t = useTranslations('Auth');
  const logout = useLogout();
  const name = readerName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" aria-label={t('account')} />}
      >
        <UserAvatar avatarUrl={user.avatarUrl} name={name} />
        <span className="hidden sm:inline">{name}</span>
        <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <span className="font-normal">
              @{user.username} · {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserRoundIcon aria-hidden="true" />
          {t('myAccount')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => toast.success(t('signedOut')),
              onError: () => toast.error(t('genericError')),
            })
          }
        >
          <LogOutIcon aria-hidden="true" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
