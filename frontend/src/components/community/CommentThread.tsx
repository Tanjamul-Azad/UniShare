import React from "react";
import { Link } from "react-router-dom";
import { Send, Trash2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "../../hooks/useApiQuery";
import {
  getCommunityComments,
  addCommunityComment,
  deleteCommunityComment,
  type CommunityComment,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { communityTimeAgo, initialsOf } from "../../lib/community";

export default function CommentThread({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { error: toastError } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["community-comments", postId];

  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const isVerified =
    user?.verificationStatus === "verified" || user?.isVerified;

  const { data: comments = [], isLoading } = useApiQuery<CommunityComment[]>({
    queryKey,
    queryFn: () => getCommunityComments(postId),
  });

  const upsert = React.useCallback(
    (comment: CommunityComment) => {
      queryClient.setQueryData<CommunityComment[]>(queryKey, (prev = []) =>
        prev.some((c) => c.id === comment.id) ? prev : [...prev, comment],
      );
    },
    [queryClient, postId],
  );

  const removeLocal = React.useCallback(
    (commentId: string) => {
      queryClient.setQueryData<CommunityComment[]>(queryKey, (prev = []) =>
        prev.filter((c) => c.id !== commentId),
      );
    },
    [queryClient, postId],
  );

  // Live updates for this post's comments.
  React.useEffect(() => {
    if (!socket) return;
    const onCreated = (payload: { postId: string; comment: CommunityComment }) => {
      if (payload.postId === postId) upsert(payload.comment);
    };
    const onDeleted = (payload: { postId: string; commentId: string }) => {
      if (payload.postId === postId) removeLocal(payload.commentId);
    };
    socket.on("community:comment_created", onCreated);
    socket.on("community:comment_deleted", onDeleted);
    return () => {
      socket.off("community:comment_created", onCreated);
      socket.off("community:comment_deleted", onDeleted);
    };
  }, [socket, postId, upsert, removeLocal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const comment = await addCommunityComment(postId, draft.trim());
      upsert(comment);
      setDraft("");
    } catch (err: any) {
      toastError(err?.message ?? "Could not post comment.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    removeLocal(commentId);
    try {
      await deleteCommunityComment(commentId);
    } catch (err: any) {
      toastError(err?.message ?? "Could not delete comment.");
      queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/60 px-4 sm:px-5 py-4">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 py-1">
          No comments yet. Be the first to help out.
        </p>
      ) : (
        <ul className="space-y-3 mb-3">
          {comments.map((c) => {
            const mine = c.authorId === user?.id;
            return (
              <li key={c.id} className="flex gap-2.5 group">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-[11px] font-semibold shrink-0">
                  {c.authorAvatar ? (
                    <img
                      src={c.authorAvatar}
                      alt={c.authorName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initialsOf(c.authorName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/seller/${c.authorId}`}
                        className="text-xs font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {c.authorName}
                      </Link>
                      {(mine || user?.role === "admin") && (
                        <button
                          onClick={() => void handleDelete(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-0.5">
                      {c.content}
                    </p>
                  </div>
                  <span className="ml-2 text-[11px] text-gray-400">
                    {communityTimeAgo(c.createdAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isVerified ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            title="Send"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-400">
          Verify your student account to join the conversation.
        </p>
      )}
    </div>
  );
}
