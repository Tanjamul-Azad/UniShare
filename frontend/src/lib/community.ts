import {
  MessageCircle,
  LifeBuoy,
  Search,
  CalendarDays,
  BookOpen,
  Home,
  type LucideIcon,
} from "lucide-react";
import type { CommunityCategory } from "./types";

type CategoryMeta = {
  label: string;
  Icon: LucideIcon;
  chip: string; // chip / badge classes
  soft: string; // soft icon-bubble classes
};

export const CATEGORY_META: Record<CommunityCategory, CategoryMeta> = {
  general: {
    label: "General",
    Icon: MessageCircle,
    chip: "bg-gray-100 text-gray-600 border-gray-200",
    soft: "bg-gray-100 text-gray-600",
  },
  help: {
    label: "Help Needed",
    Icon: LifeBuoy,
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    soft: "bg-rose-100 text-rose-600",
  },
  lost_found: {
    label: "Lost & Found",
    Icon: Search,
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    soft: "bg-amber-100 text-amber-600",
  },
  event: {
    label: "Event",
    Icon: CalendarDays,
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    soft: "bg-violet-100 text-violet-600",
  },
  study: {
    label: "Study",
    Icon: BookOpen,
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    soft: "bg-blue-100 text-blue-600",
  },
  housing: {
    label: "Housing",
    Icon: Home,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    soft: "bg-emerald-100 text-emerald-600",
  },
};

export const CATEGORY_LIST = Object.entries(CATEGORY_META).map(
  ([value, meta]) => ({ value: value as CommunityCategory, ...meta }),
);

export function communityTimeAgo(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initialsOf(name: string): string {
  return (name || "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}
