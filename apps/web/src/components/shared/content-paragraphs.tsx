import { cn } from '@/lib/utils';

/** Plain text as paragraphs (blank line = new paragraph, single breaks kept). Nothing is ever injected as HTML. */
export function ContentParagraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <div className={cn('space-y-3 text-[15.5px] leading-relaxed whitespace-pre-line', className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
