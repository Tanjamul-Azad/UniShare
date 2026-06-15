import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  MoreHorizontal,
  BadgeCheck,
  MapPin,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  toggleCommunityLike,
  resolveCommunityPost,
  deleteCommunityPost,
  type CommunityPost,
} from "../../lib/api";
import { CATEGORY_META, communityTimeAgo, initialsOf } from "../../lib/community";
import CommentThread from "./CommentThread";

type Props = {
  post: CommunityPost;
  onChange: (post: CommunityPost) => void;
  onDelete: (id: string) => void;
  defaultCommentsOpen?: boolean;
};

export default function PostCard({
  post,
  onChange,
  onDelete,
  defaultCommentsOpen = false,
}: Props) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [showComments, setShowComments] = React.useState(defaultCommentsOpen);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const meta = CATEGORY_META[post.category] ?? CATEGORY_META.general;
  const isOwner = user?.id === post.authorId;
  const canModerate = isOwner || user?.role === "admin";
  const authorVerified = post.authorVerification === "verified";

  const handleLike = async () => {
    const optimistic: CommunityPost = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    };
    onChange(optimistic);
    try {
      const res = await toggleCommunityLike(post.id);
      onChange({ ...post, likedByMe: res.liked, likeCount: res.likeCount });
    } catch (err: any) {
      onChange(post); // revert
      toastError(err?.message ?? "Could not update like.");
    }
  };

  const handleResolve = async () => {
    setMenuOpen(false);
    setBusy(true);
    try {
      const updated = await resolveCommunityPost(post.id, !post.isResolved);
      onChange(updated);
      success(updated.isResolved ? "Marked as resolved." : "Reopened.");
    } catch (err: any) {
      toastError(err?.message ?? "Could not update post.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deleteCommunityPost(post.id);
      onDelete(post.id);
    } catch (err: any) {
      toastError(err?.message ?? "Could not delete post.");
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/#/community/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      success("Post link copied to clipboard.");
    } catch {
      toastError("Could not copy link.");
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm overflow-hidden",
        post.isUrgent && !post.isResolved
          ? "border-rose-200 ring-1 ring-rose-100"
          : "border-gray-200",
      )}
    >
      {/* Urgent strip */}
      {post.isUrgent && !post.isResolved && (
        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-5 py-1.5 text-xs font-semibold border-b border-rose-100">
          <AlertCircle className="w-3.5 h-3.5" />
          Needs help now
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link
            to={`/seller/${post.authorId}`}
            className="w-10 h-10 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold shrink-0"
          >
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initialsOf(post.authorName)
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/seller/${post.authorId}`}
                className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition-colors"
              >
                {post.authorName}
              </Link>
              {authorVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
              )}
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {communityTimeAgo(post.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  meta.chip,
                )}
              >
                <meta.Icon className="w-3 h-3" />
                {meta.label}
              </span>
              {post.isResolved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Resolved
                </span>
              )}
              {post.location && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                  <MapPin className="w-3 h-3" /> {post.location}
                </span>
              )}
            </div>
          </div>

          {/* Owner / admin menu */}
          {canModerate && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                disabled={busy}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                    {isOwner && post.isUrgent && (
                      <button
                        onClick={() => void handleResolve()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {post.isResolved ? (
                          <>
                            <RotateCcw className="w-4 h-4" /> Reopen request
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Mark resolved
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => void handleDelete()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" /> Delete post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="mt-3 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.mediaUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                controls
                playsInline
                className="w-full max-h-[28rem] bg-black"
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post attachment"
                className="w-full max-h-[32rem] object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-t border-gray-100">
        <button
          onClick={() => void handleLike()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            post.likedByMe
              ? "text-rose-600 hover:bg-rose-50"
              : "text-gray-500 hover:bg-gray-100",
          )}
        >
          <Heart
            className={cn("w-4 h-4", post.likedByMe && "fill-rose-500 text-rose-500")}
          />
          {post.likeCount > 0 && post.likeCount}
          <span className="sr-only">like</span>
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            showComments ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-100",
          )}
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentCount > 0 ? post.commentCount : "Comment"}
        </button>
        <button
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showComments && <CommentThread postId={post.id} />}
    </motion.article>
  );
}
