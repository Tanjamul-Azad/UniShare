import React from "react";
import { motion } from "motion/react";
import { Search, Zap, Users, X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { useApiQuery } from "../hooks/useApiQuery";
import { useSocket } from "../context/SocketContext";
import {
  getCommunityFeed,
  type CommunityPost,
  type CommunityCategory,
} from "../lib/api";
import { CATEGORY_LIST } from "../lib/community";
import PostComposer from "../components/community/PostComposer";
import PostCard from "../components/community/PostCard";
import QueryErrorState from "../components/QueryErrorState";

type Filter = CommunityCategory | "all" | "urgent";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "urgent", label: "Urgent" },
  ...CATEGORY_LIST.map((c) => ({ value: c.value as Filter, label: c.label })),
];

export default function Community() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [filter, setFilter] = React.useState<Filter>("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [q, setQ] = React.useState("");

  // Debounce search input → applied query
  React.useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const category = filter !== "all" && filter !== "urgent" ? filter : undefined;
  const urgent = filter === "urgent";
  const queryKey = React.useMemo(
    () => ["community-feed", filter, q],
    [filter, q],
  );

  const { data: posts = [], isLoading, isError, refetch } = useApiQuery<
    CommunityPost[]
  >({
    queryKey,
    queryFn: () => getCommunityFeed({ category, urgent, q: q || undefined }),
    errorMessage: "Could not load the community feed.",
  });

  const matchesFilter = React.useCallback(
    (p: CommunityPost) => {
      if (urgent && !(p.isUrgent && !p.isResolved)) return false;
      if (category && p.category !== category) return false;
      if (q) {
        const hay = `${p.content ?? ""} ${p.location ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    },
    [urgent, category, q],
  );

  const addPost = React.useCallback(
    (post: CommunityPost) => {
      if (!matchesFilter(post)) return;
      queryClient.setQueryData<CommunityPost[]>(queryKey, (prev = []) =>
        prev.some((p) => p.id === post.id) ? prev : [post, ...prev],
      );
    },
    [queryClient, queryKey, matchesFilter],
  );

  const mergePost = React.useCallback(
    (partial: Partial<CommunityPost> & { id: string }) => {
      queryClient.setQueryData<CommunityPost[]>(queryKey, (prev = []) => {
        const idx = prev.findIndex((p) => p.id === partial.id);
        if (idx < 0) {
          if (partial.category && matchesFilter(partial as CommunityPost)) {
            return [partial as CommunityPost, ...prev];
          }
          return prev;
        }
        const merged = { ...prev[idx], ...partial };
        if (urgent && merged.isResolved) {
          return prev.filter((p) => p.id !== partial.id);
        }
        const next = [...prev];
        next[idx] = merged;
        return next;
      });
    },
    [queryClient, queryKey, matchesFilter, urgent],
  );

  const removePost = React.useCallback(
    (id: string) => {
      queryClient.setQueryData<CommunityPost[]>(queryKey, (prev = []) =>
        prev.filter((p) => p.id !== id),
      );
    },
    [queryClient, queryKey],
  );

  // Live feed updates
  React.useEffect(() => {
    if (!socket) return;
    const onCreated = (post: CommunityPost) => addPost(post);
    const onUpdated = (partial: Partial<CommunityPost> & { id: string }) =>
      mergePost(partial);
    const onDeleted = (payload: { id: string }) => removePost(payload.id);
    socket.on("community:post_created", onCreated);
    socket.on("community:post_updated", onUpdated);
    socket.on("community:post_deleted", onDeleted);
    return () => {
      socket.off("community:post_created", onCreated);
      socket.off("community:post_updated", onUpdated);
      socket.off("community:post_deleted", onDeleted);
    };
  }, [socket, addPost, mergePost, removePost]);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-5 rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 p-5 sm:p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6" />
          Campus Community
        </h1>
        <p className="text-sm text-indigo-100 mt-1 max-w-lg">
          Ask for what you need right now, share updates, and help fellow
          students — in real time.
        </p>
      </div>

      {/* Composer */}
      <div className="mb-5">
        <PostComposer onPosted={addPost} />
      </div>

      {/* Filters + search */}
      <div className="sticky top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#FAFAFA]/90 backdrop-blur-sm border-b border-gray-100/80">
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the community…"
            className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
                filter === f.value
                  ? f.value === "urgent"
                    ? "bg-rose-600 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              )}
            >
              {f.value === "urgent" && <Zap className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="mt-4 space-y-4">
        {isError ? (
          <QueryErrorState
            title="Couldn't load the feed"
            message="Please try again."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-16">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading community…
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200"
          >
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-gray-900 font-medium mb-1">
              {filter === "urgent"
                ? "No urgent requests right now"
                : q
                  ? "No posts match your search"
                  : "Nothing here yet"}
            </h4>
            <p className="text-gray-500 text-sm">
              {filter === "urgent"
                ? "When someone needs help fast, it'll show up here."
                : "Be the first to start a conversation with your campus."}
            </p>
          </motion.div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onChange={(p) => mergePost(p)}
              onDelete={removePost}
            />
          ))
        )}
      </div>
    </div>
  );
}
