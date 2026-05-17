"use client";

import { useState, useCallback } from "react";
import {
  Search, Zap, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  Loader2, ShieldAlert, Lightbulb, TrendingUp, Code2,
  GitCommitHorizontal, Sparkles, RotateCcw, Trophy, Target,
} from "lucide-react";
import {
  ErrorBoundary, ScoreGauge, MiniScore, LanguageChart, SeniorityBadge,
  RepoCard, QualityTable, LoadingSkeleton, subScoreConfig,
  type ApiResponse,
} from "./components";

type Tab = "repos" | "languages" | "activity" | "quality";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("repos");

  const handleAnalyze = useCallback(async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to analyze profile");

      const a = result.analysis || {};
      setData({
        user: result.user || {},
        repos: result.repos || [],
        analysis: {
          score: a.score ?? 0, headline: a.headline ?? "",
          summary: a.summary ?? "", seniority_estimate: a.seniority_estimate ?? "Unknown",
          strongest_project: a.strongest_project ?? "", biggest_gap: a.biggest_gap ?? "",
          red_flags: a.red_flags || [], green_flags: a.green_flags || [],
          readme_score: a.readme_score ?? 0, code_quality_score: a.code_quality_score ?? 0,
          consistency_score: a.consistency_score ?? 0, diversity_score: a.diversity_score ?? 0,
          improvement_plan: a.improvement_plan || [],
          tech_stack_verdict: a.tech_stack_verdict ?? "", commit_verdict: a.commit_verdict ?? "",
        },
        commitActivity: result.commitActivity || [],
        codeQuality: result.codeQuality || [],
        languageStats: result.languageStats || {},
        totalStars: result.totalStars ?? 0,
        totalForks: result.totalForks ?? 0,
        accountAgeDays: result.accountAgeDays ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const handleReset = () => {
    setData(null);
    setError(null);
    setUsername("");
    setActiveTab("repos");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  // ────────────────────────────────────────────
  return (
    <main className="min-h-screen">
      {/* ─── Hero (full) ─────────────────────── */}
      {!data && !loading && (
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--neon-green-glow-strong), transparent)" }} />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="w-10 h-10" style={{ color: "var(--neon-green)" }} />
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight neon-glow"
                style={{ color: "var(--neon-green)" }}>Git-Ray</h1>
            </div>
            <p className="text-lg mb-1" style={{ color: "var(--muted-light)" }}>
              AI-Powered GitHub Portfolio Review
            </p>
            <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
              Get a brutally honest engineering assessment of any GitHub profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--muted)" }} />
                <input type="text" className="search-input" placeholder="Enter GitHub username..."
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown} disabled={loading} />
              </div>
              <button className="btn-neon flex items-center justify-center gap-2"
                onClick={handleAnalyze} disabled={loading || !username.trim()}>
                <Zap className="w-5 h-5" /> Analyze
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Compact Search (after results) ─── */}
      {(data || loading) && (
        <div className="sticky top-0 z-50 px-6 py-3 animate-fade-in-up"
          style={{ background: "rgba(7,7,13,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--card-border)" }}>
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 mr-2 cursor-pointer"
              style={{ color: "var(--neon-green)" }}>
              <Zap className="w-5 h-5" />
              <span className="font-bold text-sm hidden sm:inline">Git-Ray</span>
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
              <input type="text" className="search-input-compact" placeholder="Search username..."
                value={username} onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown} disabled={loading} />
            </div>
            <button className="btn-compact flex items-center gap-1.5"
              onClick={handleAnalyze} disabled={loading || !username.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "Scanning..." : "Analyze"}
            </button>
            {data && (
              <button onClick={handleReset} className="text-xs flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer"
                style={{ color: "var(--muted-light)", background: "var(--surface)" }}>
                <RotateCcw className="w-3 h-3" /> New
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Error ───────────────────────────── */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mt-8 mb-8 animate-fade-in-up">
          <div className="card flex items-start gap-4" style={{ borderColor: "var(--red-flag)", background: "rgba(255,77,106,0.04)" }}>
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--red-flag)" }} />
            <div>
              <h3 className="font-bold text-sm mb-1" style={{ color: "var(--red-flag)" }}>Analysis Failed</h3>
              <p className="text-sm" style={{ color: "var(--muted-light)" }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Loading ─────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ─── Results ─────────────────────────── */}
      {data && (
        <ErrorBoundary>
          <section className="max-w-5xl mx-auto px-6 pt-8 pb-20">
            {/* Profile + Score Row */}
            <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img src={data.user.avatar_url} alt={data.user.login}
                  className="w-16 h-16 rounded-full flex-shrink-0"
                  style={{ outline: "2px solid var(--neon-green)", outlineOffset: "2px" }} />
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                    <h2 className="text-xl font-bold">{data.user.name || data.user.login}</h2>
                    <SeniorityBadge level={data.analysis.seniority_estimate} />
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted-light)" }}>
                    @{data.user.login}{data.user.company && ` · ${data.user.company}`}
                  </p>
                  {data.user.bio && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{data.user.bio}</p>}
                </div>
                <div className="flex gap-6 text-center flex-shrink-0">
                  {[
                    { v: data.user.public_repos, l: "Repos" },
                    { v: data.totalStars, l: "Stars", c: "var(--neon-green)" },
                    { v: data.user.followers, l: "Followers" },
                    { v: data.totalForks, l: "Forks" },
                  ].map(({ v, l, c }) => (
                    <div key={l}>
                      <div className="text-lg font-bold" style={{ color: c }}>{v}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="card-glass mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Score + Sub-scores */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                  <ScoreGauge score={data.analysis.score} />
                  <p className="text-sm font-bold italic text-center max-w-[200px]" style={{ color: "var(--foreground)" }}>
                    &ldquo;{data.analysis.headline}&rdquo;
                  </p>
                  <div className="w-full max-w-[200px]">
                    {subScoreConfig.map(({ key, label, icon }) => (
                      <MiniScore key={key} label={label} score={data.analysis[key]} icon={icon} />
                    ))}
                  </div>
                </div>

                {/* Written Review */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--neon-green)" }}>
                      AI Review
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--foreground)" }}>
                    {data.analysis.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Strongest Project */}
                    <div className="rounded-lg p-3" style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Trophy className="w-3.5 h-3.5" style={{ color: "var(--green-flag)" }} />
                        <span className="text-xs font-bold uppercase" style={{ color: "var(--green-flag)" }}>Strongest Project</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-light)" }}>
                        {data.analysis.strongest_project}
                      </p>
                    </div>
                    {/* Biggest Gap */}
                    <div className="rounded-lg p-3" style={{ background: "rgba(255,178,36,0.04)", border: "1px solid rgba(255,178,36,0.1)" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target className="w-3.5 h-3.5" style={{ color: "var(--yellow-flag)" }} />
                        <span className="text-xs font-bold uppercase" style={{ color: "var(--yellow-flag)" }}>Biggest Gap</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-light)" }}>
                        {data.analysis.biggest_gap}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Red/Green Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" style={{ color: "var(--red-flag)" }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--red-flag)" }}>Red Flags</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {data.analysis.red_flags.length > 0 ? data.analysis.red_flags.map((f, i) => (
                    <div key={i} className="flag-pill red">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{f}</span>
                    </div>
                  )) : (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No red flags — impressive!</p>
                  )}
                </div>
              </div>
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: "var(--green-flag)" }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--green-flag)" }}>Green Flags</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {data.analysis.green_flags.length > 0 ? data.analysis.green_flags.map((f, i) => (
                    <div key={i} className="flag-pill green">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{f}</span>
                    </div>
                  )) : (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No green flags detected.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Deep Dive Tabs */}
            <div className="card animate-fade-in-up" style={{ animationDelay: "0.4s", padding: 0 }}>
              <div className="tab-bar px-4">
                {([
                  { id: "repos" as Tab, label: "Repositories", icon: Code2 },
                  { id: "languages" as Tab, label: "Languages", icon: Code2 },
                  { id: "activity" as Tab, label: "Activity", icon: GitCommitHorizontal },
                  { id: "quality" as Tab, label: "Code Quality", icon: ShieldAlert },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`tab-item ${activeTab === id ? "active" : ""}`}
                    onClick={() => setActiveTab(id)}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Repos Tab */}
                {activeTab === "repos" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.repos.map((r, i) => <RepoCard key={i} repo={r} />)}
                    {data.repos.length === 0 && (
                      <p className="text-sm col-span-2" style={{ color: "var(--muted)" }}>No repositories found.</p>
                    )}
                  </div>
                )}

                {/* Languages Tab */}
                {activeTab === "languages" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-light)" }}>
                        Distribution
                      </h4>
                      <LanguageChart stats={data.languageStats} />
                      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
                        {Object.keys(data.languageStats).length} languages detected
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-light)" }}>
                        Tech Stack Verdict
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {data.analysis.tech_stack_verdict}
                      </p>
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <div>
                    <div className="mb-5">
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-light)" }}>
                        Commit Verdict
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {data.analysis.commit_verdict}
                      </p>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-light)" }}>
                      Last 30 Days
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {data.commitActivity.map((c, i) => {
                        const active = c.recentCommits > 0;
                        return (
                          <div key={i} className="rounded-lg p-3 text-center" style={{
                            background: active ? "rgba(0,255,136,0.03)" : "rgba(255,77,106,0.03)",
                            border: `1px solid ${active ? "rgba(0,255,136,0.1)" : "rgba(255,77,106,0.08)"}`,
                          }}>
                            <div className="text-xs font-medium truncate mb-1" style={{ color: "var(--muted-light)" }}>{c.repo}</div>
                            <div className="text-2xl font-bold" style={{ color: active ? "var(--green-flag)" : "var(--red-flag)" }}>
                              {c.recentCommits}
                            </div>
                            <div className="text-xs" style={{ color: "var(--muted)" }}>commits</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quality Tab */}
                {activeTab === "quality" && <QualityTable data={data.codeQuality} />}
              </div>
            </div>

            {/* Improvement Roadmap */}
            <div className="card mt-6 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4" style={{ color: "var(--yellow-flag)" }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-light)" }}>
                  Improvement Roadmap
                </h3>
              </div>
              <div className="space-y-2">
                {data.analysis.improvement_plan.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,178,36,0.03)" }}>
                    <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: "var(--yellow-flag)" }}>
                      {i + 1}.
                    </span>
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-12">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Powered by <span style={{ color: "var(--neon-green)" }}>Groq</span> · llama-3.3-70b · Next.js
              </p>
            </div>
          </section>
        </ErrorBoundary>
      )}

      {/* ─── Empty Footer ────────────────────── */}
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
