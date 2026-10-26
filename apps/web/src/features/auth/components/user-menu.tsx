'use client';

import { ChevronDownIcon, LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { toast } from '@/lib/toast';

import { useLogout } from '../api/mutations';
import type { SessionUser } from '../schemas';

/** Avatar initial + username in the header; the menu holds the account details and the logout. */
export function UserMenu({ user }: { user: SessionUser }) {
  const t = useTranslations('Auth');
  const logout = useLogout();
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" aria-label={t('account')} />}
      >
        <Avatar size="sm" className="size-6 text-[11px]">
          <AvatarFallback className="bg-primary/15 font-bold text-brand-text">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">{user.username}</span>
        <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{user.username}</span>
            <span className="font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
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
