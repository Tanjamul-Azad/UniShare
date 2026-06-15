import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { useSocket } from "../context/SocketContext";
import { getCommunityPost, type CommunityPost as Post } from "../lib/api";
import PostCard from "../components/community/PostCard";
import BackButton from "../components/BackButton";
import QueryErrorState from "../components/QueryErrorState";

export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { data, isLoading, isError, refetch } = useApiQuery<Post>({
    queryKey: ["community-post", id],
    queryFn: () => getCommunityPost(id as string),
    enabled: Boolean(id),
    errorMessage: "Could not load this post.",
  });

  const [post, setPost] = React.useState<Post | null>(null);
  React.useEffect(() => {
    if (data) setPost(data);
  }, [data]);

  // Keep this post live (likes, comment counts, resolution).
  React.useEffect(() => {
    if (!socket || !id) return;
    const onUpdated = (partial: Partial<Post> & { id: string }) => {
      if (partial.id === id) setPost((prev) => (prev ? { ...prev, ...partial } : prev));
    };
    const onDeleted = (payload: { id: string }) => {
      if (payload.id === id) navigate("/community", { replace: true });
    };
    socket.on("community:post_updated", onUpdated);
    socket.on("community:post_deleted", onDeleted);
    return () => {
      socket.off("community:post_updated", onUpdated);
      socket.off("community:post_deleted", onDeleted);
    };
  }, [socket, id, navigate]);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <BackButton fallback="/community" label="Back to Community" className="mb-4" />

      {isError ? (
        <QueryErrorState
          title="Post unavailable"
          message="This post may have been removed."
          onRetry={() => void refetch()}
        />
      ) : isLoading || !post ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-16">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading post…
        </div>
      ) : (
        <PostCard
          post={post}
          onChange={(p) => setPost(p)}
          onDelete={() => navigate("/community", { replace: true })}
          defaultCommentsOpen
        />
      )}
    </div>
  );
}
