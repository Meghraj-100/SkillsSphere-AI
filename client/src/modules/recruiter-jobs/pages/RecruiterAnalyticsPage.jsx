import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CheckCircle,
  Clock,
  FileEdit,
  TrendingUp,
  ArrowLeft,
  BarChart3,
  Zap,
  Target,
  MapPin,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import Navbar from "../../../shared/landing/Navbar";
import LoadingState from "../../../shared/components/LoadingState";
import ErrorState from "../../../shared/components/ErrorState";
import { getRecruiterAnalytics } from "../services/jobPostingService";

// Month label helper
const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split("-");
  return `${MONTH_NAMES[parseInt(month, 10)]} ${year}`;
};

// Status color map
const STATUS_CONFIG = {
  open: {
    label: "Active",
    color: "#10b981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  draft: {
    label: "Draft",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  closed: {
    label: "Closed",
    color: "#64748b",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
  },
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#64748b"];

// Custom tooltip for charts
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-400">
          {payload[0].value} {payload[0].value === 1 ? "job" : "jobs"}
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-xs text-slate-400 mb-1">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload.fill }}>
          {payload[0].value} {payload[0].value === 1 ? "job" : "jobs"}
        </p>
      </div>
    );
  }
  return null;
};

// Summary card component
const SummaryCard = ({ icon: Icon, iconColor, iconBg, hoverBorder, label, value }) => (
  <div className={`group relative rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md transition-all hover:${hoverBorder}`}>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        <span className="text-3xl font-black text-white">{value}</span>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const RecruiterAnalyticsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRecruiterAnalytics(token);
      setAnalytics(response.analytics);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  // Prepare chart data
  const pieData = useMemo(() => {
    if (!analytics) return [];
    const { statusBreakdown } = analytics;
    return [
      { name: "Active", value: statusBreakdown.open || 0, fill: PIE_COLORS[0] },
      { name: "Draft", value: statusBreakdown.draft || 0, fill: PIE_COLORS[1] },
      { name: "Closed", value: statusBreakdown.closed || 0, fill: PIE_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [analytics]);

  const barData = useMemo(() => {
    if (!analytics?.jobsByMonth) return [];
    return analytics.jobsByMonth.map((item) => ({
      month: formatMonthLabel(item.month),
      count: item.count,
    }));
  }, [analytics]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f172a,#020617)] p-5 pt-28 text-slate-100">
        <Navbar />
        <div className="py-20">
          <LoadingState message="Loading analytics..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f172a,#020617)] p-5 pt-28 text-slate-100">
        <Navbar />
        <div className="mx-auto max-w-5xl py-8">
          <ErrorState message={error} onRetry={fetchAnalytics} />
        </div>
      </main>
    );
  }

  const {
    totalJobs = 0,
    statusBreakdown = {},
    topSkills = [],
    recentJobs = [],
    totalApplicants = 0,
    applicantsByStatus = {},
    applicantsPerJob = [],
  } = analytics || {};

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f172a,#020617)] p-3 sm:p-5 pt-20 sm:pt-28 text-slate-100">
      <Navbar />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8 py-6 sm:py-8 px-0 sm:px-2">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              <p className="text-xs sm:text-sm font-medium text-blue-300 uppercase tracking-wider">
                Recruiter Intelligence
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Hiring Analytics
            </h1>
          </div>
          <Link
            to="/recruiter/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm transition-all duration-300"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>
        </div>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Briefcase}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/20"
            hoverBorder="border-blue-500/30"
            label="Total Jobs"
            value={totalJobs}
          />
          <SummaryCard
            icon={CheckCircle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/20"
            hoverBorder="border-emerald-500/30"
            label="Active"
            value={statusBreakdown.open || 0}
          />
          <SummaryCard
            icon={FileEdit}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/20"
            hoverBorder="border-amber-500/30"
            label="Drafts"
            value={statusBreakdown.draft || 0}
          />
          <SummaryCard
            icon={Clock}
            iconColor="text-slate-400"
            iconBg="bg-slate-500/20"
            hoverBorder="border-slate-500/30"
            label="Closed"
            value={statusBreakdown.closed || 0}
          />
          <SummaryCard
            icon={Users}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/20"
            hoverBorder="border-violet-500/30"
            label="Total Applicants"
            value={totalApplicants}
          />
        </section>

        {/* Applicant Pipeline Cards */}
        {totalApplicants > 0 && (
          <section className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-amber-500/30">
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{applicantsByStatus.pending || 0}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Pending Review</p>
                </div>
              </div>
            </div>
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-blue-500/30">
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Eye size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{applicantsByStatus.reviewed || 0}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Reviewed</p>
                </div>
              </div>
            </div>
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-emerald-500/30">
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{applicantsByStatus.shortlisted || 0}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Shortlisted</p>
                </div>
              </div>
            </div>
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-red-500/30">
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                  <UserX size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{applicantsByStatus.rejected || 0}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Rejected</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution - Pie Chart */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg font-bold">Status Distribution</h2>
            </div>
            <div className="p-6 h-[280px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1200}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex sm:flex-col gap-4 sm:gap-3 shrink-0">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        ></div>
                        <span className="text-xs text-slate-400 font-medium">
                          {item.name}{" "}
                          <span className="text-white font-bold">({item.value})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <Briefcase size={40} className="opacity-20 mb-3" />
                  <p className="text-sm">No jobs posted yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Posting Timeline - Bar Chart */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={20} />
                <h2 className="text-lg font-bold">Posting Timeline</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                <Calendar size={12} />
                <span>Last 6 Months</span>
              </div>
            </div>
            <div className="p-6 h-[280px]">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1200}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <TrendingUp size={40} className="opacity-20 mb-3" />
                  <p className="text-sm">No posting data in the last 6 months</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Skills Demand */}
          <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center gap-2">
              <Zap className="text-amber-400" size={20} />
              <h2 className="text-lg font-bold">Top Skills</h2>
            </div>
            <div className="p-4">
              {topSkills.length > 0 ? (
                <div className="space-y-2">
                  {topSkills.map((item, idx) => {
                    const maxCount = topSkills[0]?.count || 1;
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item.skill} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-300 capitalize">
                            {item.skill}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {item.count} {item.count === 1 ? "job" : "jobs"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <Target size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs uppercase tracking-widest">No skill data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Applicants Per Job */}
          {applicantsPerJob.length > 0 && (
            <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden backdrop-blur-md">
              <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center gap-2">
                <Users className="text-violet-400" size={20} />
                <h2 className="text-lg font-bold">Applicants per Job</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {applicantsPerJob.map((item) => {
                    const maxCount = applicantsPerJob[0]?.count || 1;
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item._id} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-300 truncate mr-2">
                            {item.title}
                          </span>
                          <span className="text-xs font-bold text-slate-500 shrink-0">
                            {item.count} {item.count === 1 ? "applicant" : "applicants"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-violet-400" size={20} />
                <h2 className="text-lg font-bold">Recent Activity</h2>
              </div>
              <Link to="/recruiter/jobs" className="text-xs font-medium text-blue-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="p-4">
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => {
                    const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
                    const locationStr = job.location
                      ? `${job.location.city || ""}${job.location.city && job.location.state ? ", " : ""}${job.location.state || ""}`
                      : "Remote";
                    return (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                            <Target size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-100 truncate">{job.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {locationStr}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase shrink-0 ${config.bg} ${config.text} border ${config.border}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <Briefcase size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
                  <p className="text-slate-400 max-w-sm mb-4">
                    Start recruiting by posting your first job opening.
                  </p>
                  <Link
                    to="/recruiter/jobs/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-500"
                  >
                    Post a New Job
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RecruiterAnalyticsPage;
