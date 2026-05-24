import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/avatar-colors";
import { FileAttachment } from "@/components/FileAttachment";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { Comment } from "@/api/types";

interface Props {
  comment: Comment;
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function renderBody(body: string) {
  // Highlight @mentions in Markdown content by post-processing the rendered HTML
  // Uses MarkdownRenderer for full GFM rendering then wraps @mentions in <mark> tags
  if (!body) return null;
  return <MarkdownRenderer content={body} className="text-sm text-text-primary leading-relaxed" />;
}

export function ThreadItem({ comment }: Props) {
  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage
          src={comment.author.avatarUrl ?? undefined}
          alt={comment.author.name}
        />
        <AvatarFallback
          className="text-xs text-white"
          style={{ backgroundColor: getAvatarColor(comment.author.name) }}
        >
          {comment.author.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
          <span className="text-sm font-medium text-text-primary">
            {comment.author.name}
          </span>
          {comment.author.role && (
            <span className="text-xs text-text-disabled">
              · {comment.author.role}
            </span>
          )}
          <span className="text-xs text-text-secondary">
            · {formatRelative(comment.createdAt)}
          </span>
        </div>
        {renderBody(comment.body)}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {comment.attachments.map((att) => (
              <FileAttachment key={att.id} attachment={att} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
