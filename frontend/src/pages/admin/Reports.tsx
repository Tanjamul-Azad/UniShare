import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Flag,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  ShieldOff,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getAdminReports, resolveAdminReport, updateUserAccountStatus, type CommunityReport } from "../../lib/api";
import QueryErrorState from "../../components/QueryErrorState";
import { useToast } from "../../context/ToastContext";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam or misleading",
  harassment: "Harassment or bullying",
  misinformation: "False information",
  inappropriate_content: "Inappropriate content",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  dismissed: { label: "Dismissed", color: "bg-gray-50 text-gray-500 border-gray-200" },
  banned: { label: "Banned", color: "bg-rose-50 text-rose-700 border-rose-200" },
  restricted: { label: "Restricted", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const USER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-emerald-600" },
  restricted: { label: "Restricted", color: "text-orange-600" },
  banned: { label: "Banned", color: "text-rose-600" },
};

export default function AdminReports() {
  const { success, error: toastError } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

  const { data: reports = [], isLoading, isError, refetch } = useApiQuery<CommunityReport[]>({
    queryKey: ["admin-reports"],
    queryFn: getAdminReports,
    errorMessage: "Could not load reports.",
  });

  const filtered = reports.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "resolved") return r.status !== "pending";
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const handleAction = async (
    report: CommunityReport,
    action: "dismissed" | "banned" | "restricted",
  ) => {
    const confirmMsgs: Record<string, string> = {
      dismissed: "Dismiss this report without action?",
      restricted: `Restrict ${report.reportedUserName}'s account? They will lose posting privileges.`,
      banned: `Ban ${report.reportedUserName}? They will be immediately locked out of their account.`,
    };
    if (!window.confirm(confirmMsgs[action])) return;

    setActioning(report.id);
    try {
      await resolveAdminReport(report.id, action);
      const actionLabels = { dismissed: "Report dismissed.", restricted: "User restricted.", banned: "User banned." };
      success(actionLabels[action]);
      await refetch();
      setExpandedId(null);
    } catch (err: any) {
      toastError(err?.message ?? "Action failed.");
    } finally {
      setActioning(null);
    }
  };

  const handleManualStatus = async (
    userId: string,
    userName: string,
    status: "active" | "banned" | "restricted",
  ) => {
    if (!window.confirm(`Set ${userName}'s account to "${status}"?`)) return;
    setActioning(userId);
    try {
      await updateUserAccountStatus(userId, status);
      success(`Account status updated to ${status}.`);
      await refetch();
    } catch (err: any) {
      toastError(err?.message ?? "Failed to update status.");
    } finally {
      setActioning(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            Community Reports
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review flagged posts and take action against users.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm text-sm font-medium shrink-0">
          {(["pending", "all", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors capitalize ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <QueryErrorState
          title="Reports unavailable"
          message="Could not load reports right now."
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {filter === "pending" ? "No pending reports — all clear!" : "No reports found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
            const userStatusCfg = USER_STATUS_CONFIG[report.reportedUserStatus] ?? USER_STATUS_CONFIG.active;
            const isBusy = actioning === report.id || actioning === report.reportedUserId;

            return (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-0.5 w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-rose-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Reported by <strong className="text-gray-700">{report.reporterName}</strong></span>
                      <span>·</span>
                      <span>Post by <strong className={userStatusCfg.color}>{report.reportedUserName}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(report.createdAt)}</span>
                    </p>
                  </div>

                  <div className="shrink-0 ml-2 mt-1">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                    {/* Reported post */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Reported Post</p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-indigo-600 capitalize bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                            {report.postCategory}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(report.postCreatedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                          {report.postContent ?? <em className="text-gray-400">No text content</em>}
                        </p>
                      </div>
                    </div>

                    {/* Reporter info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Reporter</p>
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{report.reporterName}</p>
                            <p className="text-xs text-gray-500">{report.reporterEmail}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Reported User</p>
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{report.reportedUserName}</p>
                              <span className={`text-[10px] font-bold ${userStatusCfg.color}`}>({userStatusCfg.label})</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{report.reportedUserEmail}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report reason/description */}
                    {report.description && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Reporter's Note</p>
                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 leading-relaxed">{report.description}</p>
                      </div>
                    )}

                    {/* Resolved info */}
                    {report.status !== "pending" && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <BadgeCheck className="w-4 h-4 text-gray-400 shrink-0" />
                        Reviewed by <strong className="text-gray-700">{report.reviewerName ?? "Admin"}</strong> on {report.reviewedAt ? formatDate(report.reviewedAt) : "—"} — action: <strong className="text-gray-700 capitalize">{report.status}</strong>
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === "pending" ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => void handleAction(report, "dismissed")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                        <button
                          onClick={() => void handleAction(report, "restricted")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Restrict User
                        </button>
                        <button
                          onClick={() => void handleAction(report, "banned")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          <ShieldOff className="w-4 h-4" />
                          Ban User
                        </button>
                      </div>
                    ) : (
                      /* Allow admin to change status after action */
                      <div className="flex flex-wrap gap-2 pt-1">
                        <p className="text-xs text-gray-400 w-full mb-1">Manually override user status:</p>
                        {(["active", "restricted", "banned"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => void handleManualStatus(report.reportedUserId, report.reportedUserName, s)}
                            disabled={isBusy || report.reportedUserStatus === s}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 capitalize ${
                              s === "banned"
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : s === "restricted"
                                ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
