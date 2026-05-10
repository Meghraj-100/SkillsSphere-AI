import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  MapPin,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react";
import Navbar from "../../../shared/landing/Navbar";
import LoadingState from "../../../shared/components/LoadingState";
import { getMyApplicationsDetailed } from "../services/jobService";

const statusConfig = {
  pending: { label: "Pending", bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/25" },
  reviewed: { label: "Reviewed", bg: "bg-blue-500/15", text: "text-blue-300", border: "border-blue-500/25" },
  shortlisted: { label: "Shortlisted", bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/25" },
  rejected: { label: "Rejected", bg: "bg-red-500/15", text: "text-red-300", border: "border-red-500/25" },
  withdrawn: { label: "Withdrawn", bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/25" },
};

const MyApplicationsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyApplicationsDetailed(token);
        setApplications(data.applications || []);
      } catch (err) {
        setError(err.message || "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f172a,#020617)] text-slate-100 flex flex-col">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-32 md:h-40 shrink-0"></div>

      <div className="container mx-auto px-4 pb-12 flex-1 max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            <span className="text-gradient">My</span> Applications
          </h1>
          <p className="text-slate-400 text-lg">
            Track all the jobs you&apos;ve applied to
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center bg-slate-900/30 rounded-2xl border border-white/5">
            <LoadingState message="Loading your applications..." />
          </div>
        ) : error ? (
          <div className="text-center p-10 bg-slate-900/50 rounded-2xl border border-red-500/20">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-300 font-medium mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : applications.length === 0 ? (
          /* Empty state */
          <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-white/5">
            <div className="inline-flex p-4 bg-slate-700/30 rounded-2xl mb-6">
              <Briefcase size={48} className="text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              No Applications Yet
            </h2>
            <p className="text-slate-400 mb-8">
              You haven&apos;t applied to any jobs yet. Head to the Job Board to find opportunities!
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              Browse Job Board
            </button>
          </div>
        ) : (
          /* Applications list */
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>

            {applications.map((app) => {
              const job = app.job;
              const status = statusConfig[app.status] || statusConfig.pending;

              return (
                <div
                  key={app._id}
                  className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Job info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {job?.title || "Job no longer available"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                        {job?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {job.location.city}
                            {job.location.remote && ", Remote"}
                          </span>
                        )}
                        {job?.jobLevel && (
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">
                            {job.jobLevel}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {job?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs rounded-md border border-blue-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="text-xs text-slate-500">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status + Date */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.text} border ${status.border}`}
                      >
                        {status.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Resume link + Cover note */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-4 text-sm">
                    {app.resumeLink && (
                      <a
                        href={app.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Resume Link
                      </a>
                    )}
                    {app.coverNote && (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={14} />
                        Cover note submitted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyApplicationsPage;
