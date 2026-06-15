import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ImagePlus,
  Video,
  X,
  Zap,
  MapPin,
  Loader2,
  Send,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createCommunityPost,
  type CommunityPost,
  type CommunityCategory,
  type CommunityMediaType,
} from "../../lib/api";
import { CATEGORY_LIST, initialsOf } from "../../lib/community";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export default function PostComposer({
  onPosted,
}: {
  onPosted: (post: CommunityPost) => void;
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState<CommunityCategory>("general");
  const [isUrgent, setIsUrgent] = React.useState(false);
  const [location, setLocation] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState("");
  const [mediaType, setMediaType] = React.useState<CommunityMediaType | null>(null);
  const [posting, setPosting] = React.useState(false);

  const isVerified =
    user?.verificationStatus === "verified" || user?.isVerified;

  const reset = () => {
    setContent("");
    setCategory("general");
    setIsUrgent(false);
    setLocation("");
    setMediaUrl("");
    setMediaType(null);
    setExpanded(false);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const type = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("image")
        ? "image"
        : null;
    if (!type) {
      toastError("Only image or video files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toastError("File is too large. Keep it under 15 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
      setMediaType(type);
      setExpanded(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting) return;
    if (!content.trim() && !mediaUrl) {
      toastError("Add some text or attach a photo/video.");
      return;
    }
    setPosting(true);
    try {
      const post = await createCommunityPost({
        content: content.trim() || undefined,
        category,
        isUrgent,
        location: location.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });
      onPosted(post);
      success(
        isUrgent
          ? "Your urgent request is live — the campus can see it now."
          : "Posted to the community.",
      );
      reset();
    } catch (err: any) {
      toastError(err?.message ?? "Could not publish your post.");
    } finally {
      setPosting(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
        <p className="text-sm font-semibold text-gray-900">
          Verify your UIU account to post
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Community posting is open to verified students. You can still read and
          react to posts.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            initialsOf(user?.name ?? "U")
          )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Need something on campus? Ask, share, or post a quick update…"
            rows={expanded ? 3 : 1}
            className="w-full resize-none bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400 outline-none pt-2"
          />

          {/* Media preview */}
          {mediaUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 inline-block max-w-full">
              <button
                type="button"
                onClick={() => {
                  setMediaUrl("");
                  setMediaType(null);
                }}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaType === "video" ? (
                <video src={mediaUrl} controls className="max-h-64 bg-black" />
              ) : (
                <img src={mediaUrl} alt="preview" className="max-h-64 object-contain" />
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {CATEGORY_LIST.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                        category === c.value
                          ? c.chip
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      <c.Icon className="w-3 h-3" />
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Urgent + location row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsUrgent((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors shrink-0",
                      isUrgent
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <Zap className={cn("w-3.5 h-3.5", isUrgent && "fill-white")} />
                    {isUrgent ? "Urgent — need it now" : "Mark urgent"}
                  </button>

                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (optional) — e.g. Library, Building C"
                      className="w-full rounded-full border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <ImagePlus className="w-4 h-4" /> Photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Video className="w-4 h-4" /> Video
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={posting || (!content.trim() && !mediaUrl)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
