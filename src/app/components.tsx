"use client";
import { Component, type ReactNode } from "react";
import {
  ShieldAlert, BookOpen, Shield, Activity, Layers, Star, GitFork,
  FileText, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Code2,
} from "lucide-react";

// ── Error Boundary ───────────────────────────
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card" style={{ borderColor: "var(--red-flag)" }}>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" style={{ color: "var(--red-flag)" }} />
            <div>
              <h3 className="font-bold" style={{ color: "var(--red-flag)" }}>Rendering Error</h3>
              <p className="text-sm" style={{ color: "var(--muted-light)" }}>
                Something went wrong. Try a different username.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Score Gauge ──────────────────────────────
export function ScoreGauge({ score }: { score: number }) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s: number) => s >= 70 ? "#00ff88" : s >= 40 ? "#ffb224" : "#ff4d6a";
  const getLabel = (s: number) => s >= 80 ? "Excellent" : s >= 70 ? "Strong" : s >= 50 ? "Average" : s >= 30 ? "Needs Work" : "Critical";

  return (
    <div className="gauge-container mx-auto">
      <svg className="gauge-ring" width="160" height="160" viewBox="0 0 160 160">
        <circle className="gauge-bg" cx="80" cy="80" r={radius} />
        <circle className="gauge-fill" cx="80" cy="80" r={radius}
          stroke={getColor(score)} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="gauge-score">
        <div className="number" style={{ color: getColor(score) }}>{score}</div>
        <div className="label">{getLabel(score)}</div>
      </div>
    </div>
  );
}

// ── Mini Score Bar ──────────────────────────
export function MiniScore({ label, score, icon: Icon }: {
  label: string; score: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const getColor = (s: number) => s >= 7 ? "var(--green-flag)" : s >= 4 ? "var(--yellow-flag)" : "var(--red-flag)";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getColor(score) }} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: "var(--muted-light)" }}>{label}</span>
          <span className="text-xs font-bold" style={{ color: getColor(score) }}>{score}/10</span>
        </div>
        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(score / 10) * 100}%`, background: getColor(score) }} /></div>
      </div>
    </div>
  );
}

// ── Language Chart ───────────────────────────
const langColors: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
  C: "#555555", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
  PHP: "#4F5D95", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c",
  Dart: "#00B4AB", Lua: "#000080", Vue: "#41b883", Svelte: "#ff3e00",
  "C#": "#178600", Scala: "#c22d40", R: "#198CE7",
  "Jupyter Notebook": "#DA5B0B", Haskell: "#5e5086", Elixir: "#6e4a7e",
};

export function LanguageChart({ stats }: { stats: Record<string, number> }) {
  const sorted = Object.entries(stats).sort(([, a], [, b]) => b - a).slice(0, 8);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  if (sorted.length === 0) return <p className="text-sm" style={{ color: "var(--muted)" }}>No language data.</p>;

  return (
    <div className="space-y-2.5">
      {sorted.map(([lang, bytes]) => {
        const pct = ((bytes / total) * 100).toFixed(1);
        return (
          <div key={lang} className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: langColors[lang] || "#666" }} />
            <span className="text-xs w-20 truncate" style={{ color: "var(--muted-light)" }}>{lang}</span>
            <div className="flex-1 bar-bg"><div className="bar-fill" style={{ width: `${pct}%`, background: langColors[lang] || "#666" }} /></div>
            <span className="text-xs font-mono w-12 text-right" style={{ color: "var(--muted)" }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Seniority Badge ─────────────────────────
export function SeniorityBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; border: string; color: string }> = {
    "Beginner": { bg: "rgba(255,77,106,0.08)", border: "rgba(255,77,106,0.2)", color: "#ff4d6a" },
    "Junior": { bg: "rgba(255,178,36,0.08)", border: "rgba(255,178,36,0.2)", color: "#ffb224" },
    "Mid-Level": { bg: "rgba(0,255,136,0.06)", border: "rgba(0,255,136,0.15)", color: "#00ff88" },
    "Senior": { bg: "rgba(49,120,198,0.1)", border: "rgba(49,120,198,0.25)", color: "#3178c6" },
    "Staff+": { bg: "rgba(161,123,255,0.1)", border: "rgba(161,123,255,0.25)", color: "#a97bff" },
  };
  const c = config[level] || config["Junior"];
  return (
    <span className="seniority-badge" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {level}
    </span>
  );
}

// ── Sub-score labels ────────────────────────
export const subScoreConfig = [
  { key: "readme_score" as const, label: "README", icon: BookOpen },
  { key: "code_quality_score" as const, label: "Code Quality", icon: Shield },
  { key: "consistency_score" as const, label: "Consistency", icon: Activity },
  { key: "diversity_score" as const, label: "Diversity", icon: Layers },
];

// ── Repo Card ───────────────────────────────
export function RepoCard({ repo }: { repo: RepoData }) {
  return (
    <div className="repo-card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-sm hover:underline flex items-center gap-1.5"
            style={{ color: "var(--neon-green)" }}>
            {repo.name} <ExternalLink className="w-3 h-3 opacity-40" />
          </a>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
            {repo.description || "No description"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {repo.language && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-light)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: langColors[repo.language] || "#666" }} />
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
  );
}

// ── Quality Table ───────────────────────────
export function QualityTable({ data }: { data: CodeQualityData[] }) {
  if (!data.length) return null;
  const check = (v: boolean) => v ? "✅" : "❌";
  return (
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
            <th className="text-right py-2 pl-2 font-medium">Files</th>
          </tr>
        </thead>
        <tbody>
          {data.map((q, i) => (
            <tr key={i} className="border-t" style={{ borderColor: "var(--card-border)" }}>
              <td className="py-2 pr-4 font-medium" style={{ color: "var(--neon-green)" }}>{q.repo}</td>
              <td className="text-center py-2">{check(q.hasCI)}</td>
              <td className="text-center py-2">{check(q.hasTests)}</td>
              <td className="text-center py-2">{check(q.hasLinting)}</td>
              <td className="text-center py-2">{check(q.hasGitignore)}</td>
              <td className="text-center py-2">{check(q.hasDockerfile)}</td>
              <td className="text-right py-2" style={{ color: "var(--muted-light)" }}>{q.fileCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Loading ─────────────────────────────────
export function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="flex gap-2">
          <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
        </div>
        <p className="text-sm" style={{ color: "var(--muted-light)" }}>
          Scanning GitHub profile & generating AI analysis...
        </p>
      </div>
      <div className="skeleton h-24 mb-6" />
      <div className="skeleton h-64 mb-6" />
      <div className="grid grid-cols-2 gap-6">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}

// ── Shared Types ────────────────────────────
export interface RepoData {
  name: string; full_name: string; description: string | null;
  html_url: string; language: string | null; stargazers_count: number;
  forks_count: number; open_issues_count: number; topics: string[];
  has_readme: boolean; license: { name: string } | null; updated_at: string;
}

export interface CodeQualityData {
  repo: string; hasCI: boolean; hasTests: boolean; hasDocs: boolean;
  hasLinting: boolean; hasGitignore: boolean; hasContributing: boolean;
  hasChangelog: boolean; hasDotGithub: boolean; hasEnvExample: boolean;
  hasDockerfile: boolean; fileCount: number;
}

export interface CommitActivityData {
  repo: string; totalCommits: number; recentCommits: number; lastCommitDate: string | null;
}

export interface AnalysisData {
  score: number; headline: string; summary: string;
  seniority_estimate: string; strongest_project: string; biggest_gap: string;
  red_flags: string[]; green_flags: string[]; readme_score: number;
  code_quality_score: number; consistency_score: number; diversity_score: number;
  improvement_plan: string[]; tech_stack_verdict: string; commit_verdict: string;
}

export interface UserData {
  login: string; name: string | null; avatar_url: string; bio: string | null;
  company: string | null; location: string | null; public_repos: number;
  followers: number; following: number; created_at: string;
}

export interface ApiResponse {
  user: UserData; repos: RepoData[]; analysis: AnalysisData;
  commitActivity: CommitActivityData[]; codeQuality: CodeQualityData[];
  languageStats: Record<string, number>; totalStars: number;
  totalForks: number; accountAgeDays: number;
}
