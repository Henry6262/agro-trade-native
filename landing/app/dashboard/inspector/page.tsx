"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Clock, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { apiClient } from "@/app/lib/api";
import { useAuthStore } from "@/app/stores/auth.store";

interface InspectionJob {
  id: string;
  tradeOperationId: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  qualityScore?: number;
  passed?: boolean;
  createdAt: string;
  tradeOperation?: {
    operationNumber?: string;
    buyListing?: { product?: { name: string }; quantity: number; unit: string };
  };
  product?: { name: string; category: string };
  location?: { city?: string };
}

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  pending: { badge: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10", label: "Pending" },
  in_progress: { badge: "border-blue-500/30 text-blue-400 bg-blue-500/10", label: "In Progress" },
  completed: { badge: "border-green-500/30 text-green-400 bg-green-500/10", label: "Completed" },
  cancelled: { badge: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10", label: "Cancelled" },
};

export default function InspectorDashboard() {
  const userId = useAuthStore((s) => s.user?.id);
  const [jobs, setJobs] = useState<InspectionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    apiClient
      .get<InspectionJob[]>(`/inspections/inspector/${userId}`)
      .then((res) => setJobs(Array.isArray(res) ? res : []))
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const inProgressJobs = jobs.filter((j) => j.status === "in_progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const activeJobs = [...pendingJobs, ...inProgressJobs];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Inspector Dashboard</h1>
        <p className="text-green-400/70 text-sm mt-1">View inspection jobs and submit quality reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Pending</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-green-600/20" /> : (
              <div className="text-2xl font-bold text-brand-cream">{pendingJobs.length}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-green-600/20" /> : (
              <div className="text-2xl font-bold text-brand-cream">{inProgressJobs.length}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-green-600/20" /> : (
              <div className="text-2xl font-bold text-brand-cream">{completedJobs.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 bg-green-600/10 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <ClipboardCheck className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No inspection jobs assigned.</p>
              <p className="text-xs text-text-muted">Jobs appear when trades require quality inspection.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-green-400 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Active Jobs ({activeJobs.length})
              </h2>
              {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
          {completedJobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-text-muted">Completed ({completedJobs.length})</h2>
              {completedJobs.slice(0, 10).map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job }: { job: InspectionJob }) {
  const name = job.tradeOperation?.buyListing?.product?.name || job.product?.name || `Job #${job.id.slice(0, 8)}`;
  const cfg = STATUS_STYLES[job.status] || STATUS_STYLES.pending;

  return (
    <Card className="bg-card border-brand-border hover:border-green-600/30 transition-colors">
      <CardContent className="p-4 flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="font-medium text-brand-cream">{name}</p>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            {job.tradeOperation?.buyListing && (
              <span>{job.tradeOperation.buyListing.quantity} {job.tradeOperation.buyListing.unit}</span>
            )}
            {job.location?.city && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location.city}</span>
            )}
          </div>
          {job.status === "completed" && job.qualityScore != null && (
            <span className={`text-sm ${job.passed ? "text-green-400" : "text-red-400"}`}>
              {job.passed ? <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
              Score: {job.qualityScore}/100
            </span>
          )}
          <p className="text-xs text-text-muted">{new Date(job.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant="outline" className={`text-xs ${cfg.badge}`}>{cfg.label}</Badge>
      </CardContent>
    </Card>
  );
}
