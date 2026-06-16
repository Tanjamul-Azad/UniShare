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
  Flag,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  toggleCommunityLike,
  resolveCommunityPost,
  deleteCommunityPost,
  reportCommunityPost,
  type CommunityPost,
  type CommunityReportReason,
} from "../../lib/api";
import { CATEGORY_META, communityTimeAgo, initialsOf } from "../../lib/community";
import CommentThread from "./CommentThread";

const REPORT_REASONS: { value: CommunityReportReason; label: string }[] = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misinformation", label: "False information" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

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

  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<CommunityReportReason>("spam");
  const [reportDescription, setReportDescription] = React.useState("");
  const [reportSubmitting, setReportSubmitting] = React.useState(false);

  const meta = CATEGORY_META[post.category] ?? CATEGORY_META.general;
  const isOwner = user?.id === post.authorId;
  const canModerate = isOwner || user?.role === "admin";
  const canReport = !isOwner && user?.role !== "admin";
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
      onChange(post);
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

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      const res = await reportCommunityPost(post.id, reportReason, reportDescription.trim() || undefined);
      success(res.message ?? "Report submitted.");
      setShowReportModal(false);
      setReportDescription("");
      setReportReason("spam");
    } catch (err: any) {
      toastError(err?.message ?? "Could not submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <>
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

            <div className="flex items-center gap-1 shrink-0">
              {/* Report button — visible to non-owner, non-admin users */}
              {canReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  title="Report post"
                  className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}

              {/* Owner / admin menu */}
              {canModerate && (
                <div className="relative">
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <h3 className="font-semibold text-gray-900">Report Post</h3>
              </div>
              <button
                onClick={() => { setShowReportModal(false); setReportDescription(""); }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleReport(e)} className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Why are you reporting this post?</p>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reportReason === r.value}
                        onChange={() => setReportReason(r.value)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what's wrong with this post..."
                  maxLength={1000}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowReportModal(false); setReportDescription(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
