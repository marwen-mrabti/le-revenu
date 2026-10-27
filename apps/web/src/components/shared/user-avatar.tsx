import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /** Shown as the image when present (Google picture); initials otherwise. */
  avatarUrl?: string | null;
  /** Display name when set, username otherwise: the source of the initials and the alt text. */
  name: string;
  className?: string;
}

/** One avatar for the whole site: picture when known, initials on the brand tint otherwise. */
export function UserAvatar({ avatarUrl, name, className }: UserAvatarProps) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return (
    <Avatar className={cn('size-6 text-[11px]', className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-primary/15 font-bold text-brand-text">
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
  );
}

/** The name the site shows for a reader: display name first, handle otherwise. */
export function readerName(user: { username: string; displayName?: string | null }): string {
  return user.displayName?.trim() || user.username;
}
