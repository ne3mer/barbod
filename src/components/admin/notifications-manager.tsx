"use client";

import { useState, useTransition } from "react";
import { Mail, RefreshCw, Send, AlertTriangle, CheckCircle, Clock, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchNotificationLogsAction, sendOwnerTestEmailAction } from "@/app/admin/(dashboard)/notifications/actions";
import type { NotificationJobRow } from "@/lib/email/types";

type NotificationsManagerProps = {
  initialLogs: NotificationJobRow[];
};

export function NotificationsManager({ initialLogs }: NotificationsManagerProps) {
  const [logs, setLogs] = useState<NotificationJobRow[]>(initialLogs);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [selectedJob, setSelectedJob] = useState<NotificationJobRow | null>(null);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await fetchNotificationLogsAction({
        status: statusFilter,
        type: typeFilter,
      });
      if (res.logs) {
        setLogs(res.logs);
      }
    });
  };

  const handleFilterChange = (newStatus: string, newType: string) => {
    setStatusFilter(newStatus);
    setTypeFilter(newType);
    startTransition(async () => {
      const res = await fetchNotificationLogsAction({
        status: newStatus,
        type: newType,
      });
      if (res.logs) {
        setLogs(res.logs);
      }
    });
  };

  const handleSendTestEmail = () => {
    setTestResult(null);
    startTransition(async () => {
      const res = await sendOwnerTestEmailAction();
      if (res.error) {
        setTestResult({ error: res.error });
      } else {
        setTestResult({ success: true, message: res.message });
        handleRefresh();
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="size-3" /> Sent
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            <Clock className="size-3" /> Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            <RefreshCw className="size-3 animate-spin" /> Processing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
            <AlertTriangle className="size-3" /> Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-400 border border-zinc-500/20">
            <XCircle className="size-3" /> Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const sentCount = logs.filter((l) => l.status === "sent").length;
  const pendingCount = logs.filter((l) => l.status === "pending").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header & Dev Test Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="size-5 text-primary" /> Email Notifications Log
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Transactional email history, scheduled reminders, and delivery logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSendTestEmail}
            disabled={isPending}
            className="gap-2 text-xs bg-primary text-primary-foreground"
          >
            <Send className="size-3.5" />
            Send Owner Test Email
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center justify-between border ${
            testResult.error
              ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          }`}
        >
          <span>{testResult.error || testResult.message}</span>
          <button onClick={() => setTestResult(null)} className="text-muted-foreground hover:text-foreground">
            &times;
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground">Total Logs</span>
          <p className="text-2xl font-bold text-foreground mt-1">{logs.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-xs font-medium text-emerald-400">Delivered / Sent</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{sentCount}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-xs font-medium text-amber-400">Pending Queue</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-xs font-medium text-rose-400">Failed Delivery</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{failedCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-card/50 p-4 rounded-lg border border-border/80">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value, typeFilter)}
            className="bg-background text-foreground text-xs rounded-md border border-border px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
            className="bg-background text-foreground text-xs rounded-md border border-border px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Notification Types</option>
            <option value="appointment_booked">Appointment Booked</option>
            <option value="appointment_confirmed">Appointment Confirmed</option>
            <option value="appointment_cancelled">Appointment Cancelled</option>
            <option value="appointment_rescheduled">Appointment Rescheduled</option>
            <option value="customer_reminder_24h">24h Customer Reminder</option>
            <option value="customer_reminder_2h">2h Customer Reminder</option>
            <option value="barber_new_appointment">Barber New Appointment</option>
            <option value="barber_cancellation">Barber Cancellation</option>
            <option value="barber_reschedule">Barber Reschedule</option>
            <option value="barber_daily_digest">Barber Daily Digest</option>
          </select>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-muted/40 text-foreground font-semibold border-b border-border uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Scheduled / Created</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    No notification logs found.
                  </td>
                </tr>
              ) : (
                logs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                      {new Date(job.scheduled_for || job.created_at).toLocaleString("hu-HU")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-zinc-300 bg-zinc-800/80 px-2 py-1 rounded">
                        {job.notification_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground whitespace-nowrap">
                      <div>{job.recipient_email}</div>
                      <span className="text-[10px] text-muted-foreground capitalize">({job.recipient_type})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                    <td className="py-3 px-4 font-mono">{job.attempts}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {job.sent_at ? new Date(job.sent_at).toLocaleTimeString("hu-HU") : "—"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                        className="h-7 px-2 text-xs"
                      >
                        <Info className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Notification Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Job ID:</span>
                <span className="font-mono text-[11px]">{selectedJob.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Type:</span>
                <span className="font-mono text-primary">{selectedJob.notification_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Recipient:</span>
                <span>{selectedJob.recipient_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Status:</span>
                <span>{selectedJob.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Attempts:</span>
                <span>{selectedJob.attempts}</span>
              </div>
              {selectedJob.provider_message_id && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="font-semibold text-foreground">Resend ID:</span>
                  <span className="font-mono text-[11px]">{selectedJob.provider_message_id}</span>
                </div>
              )}
              {selectedJob.last_error && (
                <div className="py-2 text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">
                  <span className="font-bold block mb-1">Last Error:</span>
                  <p className="font-mono text-[11px] break-all">{selectedJob.last_error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
