"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Star,
  GitFork,
  ExternalLink,
  ArrowRight,
  Github,
  Loader2,
  ShieldAlert,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Activity,
  Code2,
  Shield,
  Layers,
  GitCommitHorizontal,
  TestTube2,
  Container,
  Settings2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────

interface UserData {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  has_readme: boolean;
  license: { name: string } | null;
  updated_at: string;
}

interface AnalysisData {
  score: number;
  headline: string;
  red_flags: string[];
  green_flags: string[];
  readme_score: number;
  code_quality_score: number;
  consistency_score: number;
  diversity_score: number;
  improvement_plan: string[];
  tech_stack_verdict: string;
  commit_verdict: string;
}

interface CommitActivityData {
  repo: string;
  totalCommits: number;
  recentCommits: number;
  lastCommitDate: string | null;
}

interface CodeQualityData {
  repo: string;
  hasCI: boolean;
  hasTests: boolean;
  hasDocs: boolean;
  hasLinting: boolean;
  hasGitignore: boolean;
  hasContributing: boolean;
  hasChangelog: boolean;
  hasDotGithub: boolean;
  hasEnvExample: boolean;
  hasDockerfile: boolean;
  fileCount: number;
}

interface ApiResponse {
  user: UserData;
  repos: RepoData[];
  analysis: AnalysisData;
  commitActivity: CommitActivityData[];
  codeQuality: CodeQualityData[];
  languageStats: Record<string, number>;
  totalStars: number;
  totalForks: number;
  accountAgeDays: number;
}

// ── Score Gauge ──────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return "#00ff88";
    if (s >= 40) return "#ffa502";
    return "#ff4757";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 70) return "Strong";
    if (s >= 50) return "Average";
    if (s >= 30) return "Needs Work";
    return "Critical";
  };

  return (
    <div className="gauge-container mx-auto">
      <svg className="gauge-ring" width="200" height="200" viewBox="0 0 200 200">
        <circle className="gauge-bg" cx="100" cy="100" r={radius} />
        <circle
          className="gauge-fill"
          cx="100"
          cy="100"
          r={radius}
          stroke={getColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-score">
        <div className="number" style={{ color: getColor(score) }}>
          {score}
        </div>
        <div className="label">{getLabel(score)}</div>
      </div>
    </div>
  );
}

// ── Mini Score Bar ───────────────────────────────────────
function MiniScore({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const getColor = (s: number) => {
    if (s >= 7) return "var(--green-flag)";
    if (s >= 4) return "var(--yellow-flag)";
    return "var(--red-flag)";
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: getColor(score) }} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: "var(--muted-light)" }}>
            {label}
          </span>
          <span className="text-xs font-bold" style={{ color: getColor(score) }}>
            {score}/10
          </span>
        </div>
        <div className="readme-bar-bg">
          <div
            className="readme-bar-fill"
            style={{
              width: `${(score / 10) * 100}%`,
              background: getColor(score),
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Language Bar Chart ───────────────────────────────────
function LanguageChart({ stats }: { stats: Record<string, number> }) {
  const sorted = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      {sorted.map(([lang, bytes]) => {
        const pct = ((bytes / total) * 100).toFixed(1);
        return (
          <div key={lang} className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: langColors[lang] || "#666" }}
            />
            <span className="text-xs w-20 truncate" style={{ color: "var(--muted-light)" }}>
              {lang}
            </span>
            <div className="flex-1 readme-bar-bg">
              <div
                className="readme-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: langColors[lang] || "#666",
                }}
              />
            </div>
            <span className="text-xs font-mono w-12 text-right" style={{ color: "var(--muted)" }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quality Signal Badge ─────────────────────────────────
function QualityBadge({ label, has, icon: Icon }: {
  label: string;
  has: boolean;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
      style={{
        background: has ? "rgba(0,255,136,0.06)" : "rgba(255,71,87,0.06)",
        border: `1px solid ${has ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)"}`,
        color: has ? "var(--green-flag)" : "var(--red-flag)",
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-center gap-3 mb-10">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--neon-green)" }} />
        <p className="text-lg" style={{ color: "var(--muted-light)" }}>
          Deep scanning GitHub profile & generating AI analysis...
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="skeleton h-72 mb-6"></div>
          <div className="skeleton h-40"></div>
        </div>
        <div className="lg:col-span-2">
          <div className="skeleton h-36 mb-6"></div>
          <div className="skeleton h-52 mb-6"></div>
          <div className="skeleton h-40"></div>
        </div>
      </div>
    </div>
  );
}

// ── Language Colors ──────────────────────────────────────
const langColors: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
  C: "#555555", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
  PHP: "#4F5D95", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c",
  Dart: "#00B4AB", Lua: "#000080", Vue: "#41b883", Svelte: "#ff3e00",
  "C#": "#178600", Scala: "#c22d40", R: "#198CE7", Jupyter: "#F37626",
  "Jupyter Notebook": "#DA5B0B", Haskell: "#5e5086", Elixir: "#6e4a7e",
};

// ── Main Page ────────────────────────────────────────────
export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze profile");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  return (
    <main className="min-h-screen">
      {/* ─── Hero Section ──────────────────────── */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--neon-green-glow-strong), transparent)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--neon-green-glow-strong), transparent)" }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Zap className="w-10 h-10" style={{ color: "var(--neon-green)" }} />
            <h1
              className="text-5xl md:text-6xl font-extrabold tracking-tight neon-glow"
              style={{ color: "var(--neon-green)" }}
            >
              Git-Ray
            </h1>
          </div>
          <p className="text-lg md:text-xl mb-2" style={{ color: "var(--muted-light)" }}>
            Deep AI-Powered Recruiter Audit
          </p>
          <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
            Enter any GitHub username. Get a brutally honest FAANG-level portfolio review — analyzing code quality, commit patterns, tech diversity, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="text"
                className="search-input"
                placeholder="Enter GitHub username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            <button
              className="btn-neon flex items-center justify-center gap-2"
              onClick={handleAnalyze}
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {loading ? "Scanning..." : "Analyze"}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Error ────────────────────────────── */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div
            className="card flex items-start gap-4"
            style={{ borderColor: "var(--red-flag)", background: "rgba(255, 71, 87, 0.05)" }}
          >
            <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "var(--red-flag)" }} />
            <div>
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--red-flag)" }}>
                Analysis Failed
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-light)" }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Loading ──────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ─── Dashboard ────────────────────────── */}
      {data && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          {/* User Profile Bar */}
          <div
            className="card flex flex-col sm:flex-row items-center gap-6 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src={data.user.avatar_url}
              alt={data.user.login}
              className="w-16 h-16 rounded-full"
              style={{ outline: "2px solid var(--neon-green)", outlineOffset: "2px" }}
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">
                {data.user.name || data.user.login}
              </h2>
              <p className="text-sm" style={{ color: "var(--muted-light)" }}>
                @{data.user.login}
                {data.user.company && ` · ${data.user.company}`}
              </p>
              {data.user.bio && (
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{data.user.bio}</p>
              )}
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xl font-bold">{data.user.public_repos}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Repos</div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: "var(--neon-green)" }}>
                  {data.totalStars}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Total ⭐</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.user.followers}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.totalForks}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Forks</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column — Score + Sub-scores */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Score */}
              <div
                className="card neon-border text-center animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-6"
                  style={{ color: "var(--muted-light)" }}
                >
                  Employability Score
                </h3>
                <ScoreGauge score={data.analysis.score} />
                <p className="mt-6 text-lg font-bold italic" style={{ color: "var(--foreground)" }}>
                  &ldquo;{data.analysis.headline}&rdquo;
                </p>
              </div>

              {/* Sub-scores */}
              <div
                className="card animate-fade-in-up"
                style={{ animationDelay: "0.25s" }}
              >
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: "var(--muted-light)" }}
                >
                  Detailed Breakdown
                </h3>
                <MiniScore label="README Quality" score={data.analysis.readme_score} icon={BookOpen} />
                <MiniScore label="Code Quality" score={data.analysis.code_quality_score} icon={Shield} />
                <MiniScore label="Consistency" score={data.analysis.consistency_score} icon={Activity} />
                <MiniScore label="Tech Diversity" score={data.analysis.diversity_score} icon={Layers} />
              </div>

              {/* Language Distribution */}
              <div
                className="card animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--muted-light)" }}
                  >
                    Language Distribution
                  </h3>
                </div>
                <LanguageChart stats={data.languageStats} />
                <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
                  {Object.keys(data.languageStats).length} languages detected across repos
                </p>
              </div>
            </div>

            {/* Right Column — Flags, Quality, Repos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Verdicts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="card animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    <h3
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--neon-green)" }}
                    >
                      Tech Stack Verdict
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {data.analysis.tech_stack_verdict}
                  </p>
                </div>
                <div
                  className="card animate-fade-in-up"
                  style={{ animationDelay: "0.35s" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <GitCommitHorizontal className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    <h3
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--neon-green)" }}
                    >
                      Commit Verdict
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {data.analysis.commit_verdict}
                  </p>
                </div>
              </div>

              {/* Red/Green Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card animate-fade-in-up" style={{ animationDelay: "0.38s" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" style={{ color: "var(--red-flag)" }} />
                    <h3
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--red-flag)" }}
                    >
                      Red Flags
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.analysis.red_flags.map((flag, i) => (
                      <div key={i} className="flag-pill red">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                    {data.analysis.red_flags.length === 0 && (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        No red flags — impressive!
                      </p>
                    )}
                  </div>
                </div>

                <div className="card animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: "var(--green-flag)" }} />
                    <h3
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--green-flag)" }}
                    >
                      Green Flags
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.analysis.green_flags.map((flag, i) => (
                      <div key={i} className="flag-pill green">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                    {data.analysis.green_flags.length === 0 && (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        No green flags detected.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Quality Matrix */}
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.42s" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--muted-light)" }}
                  >
                    Code Quality Matrix
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: "var(--muted)" }}>
                        <th className="text-left py-2 pr-4 font-medium">Repo</th>
                        <th className="text-center py-2 px-2 font-medium">CI/CD</th>
                        <th className="text-center py-2 px-2 font-medium">Tests</th>
                        <th className="text-center py-2 px-2 font-medium">Lint</th>
                        <th className="text-center py-2 px-2 font-medium">.gitignore</th>
                        <th className="text-center py-2 px-2 font-medium">Docker</th>
                        <th className="text-center py-2 px-2 font-medium">Docs</th>
                        <th className="text-right py-2 pl-2 font-medium">Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.codeQuality.map((q, i) => (
                        <tr
                          key={i}
                          className="border-t"
                          style={{ borderColor: "var(--card-border)" }}
                        >
                          <td className="py-2 pr-4 font-medium" style={{ color: "var(--neon-green)" }}>
                            {q.repo}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasCI ? "✅" : "❌"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasTests ? "✅" : "❌"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasLinting ? "✅" : "❌"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasGitignore ? "✅" : "❌"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasDockerfile ? "✅" : "❌"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {q.hasDocs ? "✅" : "❌"}
                          </td>
                          <td className="text-right py-2 pl-2" style={{ color: "var(--muted-light)" }}>
                            {q.fileCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commit Activity */}
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.44s" }}>
                <div className="flex items-center gap-2 mb-4">
                  <GitCommitHorizontal className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--muted-light)" }}
                  >
                    Recent Commit Activity (30d)
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.commitActivity.map((c, i) => {
                    const isActive = c.recentCommits > 0;
                    return (
                      <div
                        key={i}
                        className="rounded-lg p-3 text-center"
                        style={{
                          background: isActive ? "rgba(0,255,136,0.04)" : "rgba(255,71,87,0.04)",
                          border: `1px solid ${isActive ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.1)"}`,
                        }}
                      >
                        <div
                          className="text-xs font-medium truncate mb-1"
                          style={{ color: "var(--muted-light)" }}
                        >
                          {c.repo}
                        </div>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: isActive ? "var(--green-flag)" : "var(--red-flag)" }}
                        >
                          {c.recentCommits}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          commits
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Repo Health */}
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.46s" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Github className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--muted-light)" }}
                  >
                    Repo Health
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.repos.map((repo, i) => (
                    <div key={i} className="repo-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm hover:underline flex items-center gap-1"
                            style={{ color: "var(--neon-green)" }}
                          >
                            {repo.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                            {repo.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {repo.language && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-light)" }}>
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ background: langColors[repo.language] || "#666" }}
                            />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-light)" }}>
                          <Star className="w-3 h-3" /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-light)" }}>
                          <GitFork className="w-3 h-3" /> {repo.forks_count}
                        </span>
                        {repo.has_readme ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green-flag)" }}>
                            <FileText className="w-3 h-3" /> README
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--red-flag)" }}>
                            <XCircle className="w-3 h-3" /> No README
                          </span>
                        )}
                        {repo.license ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green-flag)" }}>
                            <CheckCircle2 className="w-3 h-3" /> {repo.license.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--yellow-flag)" }}>
                            <AlertTriangle className="w-3 h-3" /> No License
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Fixes */}
          <div className="card mt-6 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-5 h-5" style={{ color: "var(--yellow-flag)" }} />
              <h3
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--muted-light)" }}
              >
                Quick Fixes — Improvement Plan
              </h3>
            </div>
            <div className="space-y-3">
              {data.analysis.improvement_plan.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255, 165, 2, 0.04)" }}
                >
                  <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--yellow-flag)" }} />
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Powered by <span style={{ color: "var(--neon-green)" }}>Groq</span> · llama-3.3-70b-versatile · Built with Next.js
            </p>
          </div>
        </section>
      )}

      {/* ─── Empty Footer ─────────────────────── */}
      {!data && !loading && !error && (
        <div className="text-center pb-20">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Powered by <span style={{ color: "var(--neon-green)" }}>Groq</span> · GitHub REST API · Next.js
          </p>
        </div>
      )}
    </main>
  );
}
