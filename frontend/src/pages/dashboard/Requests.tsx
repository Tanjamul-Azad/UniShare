import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Check,
  X,
  Heart,
  RefreshCw,
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  PackageCheck,
  Undo2,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import {
  getIncomingRequests,
  getMyRequests,
  reviewRequest,
  type IncomingRequest,
  type OutgoingRequest,
  type RequestStatus,
  type RequestAction,
} from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../context/ToastContext";
import ResponsiveImage from "../../components/ResponsiveImage";
import QueryErrorState from "../../components/QueryErrorState";

type Tab = "incoming" | "sent";

const statusStyle: Record<RequestStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  borrowed: { label: "Borrowed", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", Icon: CheckCircle2 },
  returned: { label: "Returned", cls: "bg-slate-50 text-slate-600 border-slate-200", Icon: CheckCircle2 },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  rejected: { label: "Declined", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const s = statusStyle[status] ?? statusStyle.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      <s.Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function KindBadge({ kind }: { kind: "borrow" | "trade" }) {
  return kind === "borrow" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
      <Heart className="w-3 h-3" /> Borrow
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold">
      <RefreshCw className="w-3 h-3" /> Trade
    </span>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Thumb({ src, title }: { src?: string; title: string }) {
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
      {src ? (
        <ResponsiveImage
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          sizes="56px"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        (name || "U").charAt(0).toUpperCase()
      )}
    </div>
  );
}

type ActionDef = {
  label: string;
  status: RequestAction;
  tone: "accept" | "advance" | "decline";
  Icon: React.ElementType;
};

const toneClass: Record<ActionDef["tone"], string> = {
  accept: "bg-emerald-600 text-white hover:bg-emerald-700",
  advance: "bg-indigo-600 text-white hover:bg-indigo-700",
  decline: "border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
};

// The owner-driven actions available for an incoming request at its current status.
function nextActions(req: IncomingRequest): ActionDef[] {
  if (req.status === "pending") {
    return [
      { label: "Accept", status: "approved", tone: "accept", Icon: Check },
      { label: "Decline", status: "rejected", tone: "decline", Icon: X },
    ];
  }
  if (req.kind === "borrow") {
    if (req.status === "approved")
      return [{ label: "Mark as handed over", status: "borrowed", tone: "advance", Icon: PackageCheck }];
    if (req.status === "borrowed")
      return [{ label: "Mark as returned", status: "returned", tone: "advance", Icon: Undo2 }];
  } else if (req.status === "approved") {
    return [{ label: "Mark as completed", status: "completed", tone: "advance", Icon: CheckCircle2 }];
  }
  return [];
}

const actionToast: Record<RequestAction, string> = {
  approved: "accepted",
  rejected: "declined",
  borrowed: "marked as handed over",
  returned: "marked as returned",
  completed: "marked as completed",
};

export default function Requests() {
  const [tab, setTab] = React.useState<Tab>("incoming");
  const [actionId, setActionId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const incoming = useApiQuery<IncomingRequest[]>({
    queryKey: ["incoming-requests"],
    queryFn: getIncomingRequests,
    errorMessage: "Could not load incoming requests.",
  });

  const sent = useApiQuery<OutgoingRequest[]>({
    queryKey: ["my-requests"],
    queryFn: getMyRequests,
    errorMessage: "Could not load your requests.",
  });

  const incomingList = incoming.data ?? [];
  const sentList = sent.data ?? [];
  const pendingIncoming = incomingList.filter((r) => r.status === "pending").length;

  const handleReview = async (req: IncomingRequest, status: RequestAction) => {
    setActionId(req.id);
    try {
      await reviewRequest(req.kind, req.id, status);
      success(`You ${actionToast[status]} the ${req.kind} request for "${req.itemTitle}".`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["incoming-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
    } catch (err: any) {
      toastError(err?.message ?? "Could not update the request.");
    } finally {
      setActionId(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "incoming", label: "Incoming", icon: Inbox, count: incomingList.length },
    { key: "sent", label: "Sent", icon: Send, count: sentList.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              Requests
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage borrow &amp; trade requests on your listings, and track the ones you sent.
            </p>
          </div>
          {pendingIncoming > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs font-semibold">
              {pendingIncoming} awaiting you
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 inline-flex rounded-xl bg-gray-100 p-1 gap-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === key ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {count}
              </span>
              {key === "incoming" && pendingIncoming > 0 && tab !== "incoming" && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-gray-100" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {tab === "incoming" ? (
          incoming.isError ? (
            <QueryErrorState
              title="Couldn't load incoming requests"
              message="Please try again."
              onRetry={() => void incoming.refetch()}
            />
          ) : incoming.isLoading ? (
            <SkeletonList />
          ) : incomingList.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No requests yet"
              message="When someone asks to borrow or trade for one of your shared/barter listings, it'll show up here."
              cta={{ to: "/marketplace/new", label: "Create a listing" }}
            />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {incomingList.map((req) => (
                  <motion.li
                    key={`${req.kind}-${req.id}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex gap-4">
                      <Thumb src={req.itemImage} title={req.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <KindBadge kind={req.kind} />
                          <StatusBadge status={req.status} />
                          <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
                        </div>
                        <Link
                          to={`/marketplace/${req.itemId}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {req.itemTitle}
                        </Link>
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
                          <Avatar name={req.requesterName} src={req.requesterAvatar} />
                          <span className="font-medium text-gray-800">{req.requesterName}</span>
                          <span className="text-gray-400">
                            {req.kind === "borrow" ? "wants to borrow this" : "offers a trade"}
                          </span>
                        </div>
                        {(req.message || req.offerDescription) && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                            “{req.message || req.offerDescription}”
                          </p>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(() => {
                            const actions = nextActions(req);
                            if (actions.length > 0) {
                              return actions.map((a) => (
                                <button
                                  key={a.status}
                                  onClick={() => void handleReview(req, a.status)}
                                  disabled={actionId === req.id}
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${toneClass[a.tone]}`}
                                >
                                  <a.Icon className="w-4 h-4" /> {a.label}
                                </button>
                              ));
                            }
                            return (
                              <span className="text-xs text-gray-400">
                                {req.status === "rejected" ? "Declined" : "Completed"}
                                {req.reviewedAt ? ` · ${timeAgo(req.reviewedAt)}` : ""}
                              </span>
                            );
                          })()}
                          <Link
                            to={`/inbox?participant=${req.requesterId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 px-3 py-1.5 text-sm font-semibold hover:bg-indigo-100 transition-colors ml-auto"
                          >
                            <MessageSquare className="w-4 h-4" /> Message
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )
        ) : sent.isError ? (
          <QueryErrorState
            title="Couldn't load your requests"
            message="Please try again."
            onRetry={() => void sent.refetch()}
          />
        ) : sent.isLoading ? (
          <SkeletonList />
        ) : sentList.length === 0 ? (
          <EmptyState
            icon={Send}
            title="You haven't sent any requests"
            message="Browse the marketplace and request to borrow shared items or propose trades for barter listings."
            cta={{ to: "/marketplace", label: "Browse marketplace" }}
          />
        ) : (
          <ul className="space-y-3">
            {sentList.map((req) => (
              <li
                key={`${req.kind}-${req.id}`}
                className="rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex gap-4">
                  <Thumb src={req.itemImage} title={req.itemTitle} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <KindBadge kind={req.kind} />
                      <StatusBadge status={req.status} />
                      <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
                    </div>
                    <Link
                      to={`/marketplace/${req.itemId}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                    >
                      {req.itemTitle}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      To <span className="font-medium text-gray-700">{req.ownerName}</span>
                    </p>
                    {(req.message || req.offerDescription) && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                        “{req.message || req.offerDescription}”
                      </p>
                    )}
                    <div className="mt-3">
                      <Link
                        to={`/inbox?participant=${req.ownerId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 px-3 py-1.5 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Message owner
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-4 flex gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="text-center py-14 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h4 className="text-gray-900 font-medium mb-1">{title}</h4>
      <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">{message}</p>
      <Link
        to={cta.to}
        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
      >
        {cta.label}
      </Link>
    </div>
  );
}
