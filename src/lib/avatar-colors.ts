export const AVATAR_COLORS = [
  "#6366F1",
  "#0891B2",
  "#059669",
  "#DC2626",
  "#D97706",
  "#8B5CF6",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
