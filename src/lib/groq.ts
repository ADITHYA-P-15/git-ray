import Groq from "groq-sdk";
import { GitHubData } from "./github";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface AnalysisResult {
    score: number;
    headline: string;
    summary: string;
    seniority_estimate: string;
    strongest_project: string;
    biggest_gap: string;
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

export async function analyzeWithGroq(
    data: GitHubData
): Promise<AnalysisResult> {
    const systemPrompt = `You are a world-class Staff Engineer conducting a thorough portfolio review. You think like a hiring manager at a top tech company — you care about signal, not noise. You look for evidence of real engineering: clean architecture, testing discipline, documentation, consistency, and growth over time.

Your reviews are specific, evidence-backed, and constructive. You reference actual repo names, actual languages, and actual patterns you observe. You never use vague filler. Every sentence contains a data point or actionable insight.

You must respond ONLY with a valid JSON object.`;

    // Build rich context from all the data
    const totalRecentCommits = data.commitActivity.reduce((s, c) => s + c.recentCommits, 0);
    const reposWithCI = data.codeQuality.filter((q) => q.hasCI).length;
    const reposWithTests = data.codeQuality.filter((q) => q.hasTests).length;
    const reposWithLinting = data.codeQuality.filter((q) => q.hasLinting).length;
    const reposWithDocs = data.codeQuality.filter((q) => q.hasDocs).length;

    const topLanguages = Object.entries(data.languageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([lang, bytes]) => `${lang}: ${(bytes / 1024).toFixed(0)}KB`);

    const userPrompt = `Analyze this GitHub portfolio. Return a JSON object matching this exact schema:
{
  "score": <number 0-100, overall portfolio quality score>,
  "headline": <string, a sharp one-liner that captures this developer's identity, e.g. "Full-Stack Builder with Zero Testing Discipline" or "Data Science Polyglot, Needs Production Polish">,
  "summary": <string, a 3-4 sentence written review as if you're briefing a hiring manager. Be specific — mention repos by name, cite numbers, highlight the most interesting thing about this developer. This is the most important field — make it insightful and memorable.>,
  "seniority_estimate": <string, one of: "Beginner" / "Junior" / "Mid-Level" / "Senior" / "Staff+" — based on evidence like project complexity, code quality signals, language breadth, and account age>,
  "strongest_project": <string, name the single best repo and explain in one sentence WHY it's their strongest work — cite specific signals like CI, tests, documentation, stars, or structure>,
  "biggest_gap": <string, the single most impactful improvement they should make — be specific and actionable, not generic>,
  "red_flags": <string[], max 4 — each must cite a specific repo or data point. No generic observations. Bad: "No tests". Good: "0 of 6 repos have any test directory — even the 200-file project 'webapp' has zero test coverage">,
  "green_flags": <string[], max 4 — each must cite a specific repo or data point>,
  "readme_score": <number 0-10>,
  "code_quality_score": <number 0-10>,
  "consistency_score": <number 0-10>,
  "diversity_score": <number 0-10>,
  "improvement_plan": <string[], max 5 — numbered priority steps, each referencing a specific repo by name>,
  "tech_stack_verdict": <string, 2-3 sentence assessment of their technology choices, breadth, and depth>,
  "commit_verdict": <string, 2-3 sentence assessment of their commit consistency, activity patterns, and growth trajectory>
}

=== DEVELOPER PROFILE ===

Username: ${data.user.login}
Name: ${data.user.name || "Not set"}
Bio: ${data.user.bio || "No bio set"}
Company: ${data.user.company || "None"}
Location: ${data.user.location || "Unknown"}
Public Repos: ${data.user.public_repos}
Followers: ${data.user.followers} | Following: ${data.user.following}
Account Age: ${data.accountAgeDays} days (${(data.accountAgeDays / 365).toFixed(1)} years)
Total Stars: ${data.totalStars}
Total Forks: ${data.totalForks}

=== LANGUAGES (${Object.keys(data.languageStats).length} detected) ===
${topLanguages.length > 0 ? topLanguages.join("\n") : "No language data available"}

=== TOP REPOSITORIES ===
${data.repos
            .map(
                (r, i) => `${i + 1}. ${r.name} — ${r.description || "No description"}
   Lang: ${r.language || "N/A"} | ⭐${r.stargazers_count} | 🍴${r.forks_count} | Issues: ${r.open_issues_count}
   License: ${r.license?.name || "NONE"} | README: ${r.has_readme ? "YES" : "NO"}
   Topics: ${r.topics.length > 0 ? r.topics.join(", ") : "None"}
   Updated: ${r.updated_at}`
            )
            .join("\n")}

=== COMMIT ACTIVITY (30 days) ===
Total recent commits: ${totalRecentCommits}
${data.commitActivity
            .map(
                (c) =>
                    `- ${c.repo}: ${c.recentCommits} commits | Last: ${c.lastCommitDate || "Unknown"}`
            )
            .join("\n")}

=== CODE QUALITY SIGNALS ===
CI/CD: ${reposWithCI}/${data.codeQuality.length} repos
Tests: ${reposWithTests}/${data.codeQuality.length} repos
Linting: ${reposWithLinting}/${data.codeQuality.length} repos
Docs: ${reposWithDocs}/${data.codeQuality.length} repos
${data.codeQuality
            .map(
                (q) =>
                    `- ${q.repo}: CI:${q.hasCI ? "✓" : "✗"} Tests:${q.hasTests ? "✓" : "✗"} Lint:${q.hasLinting ? "✓" : "✗"} .gitignore:${q.hasGitignore ? "✓" : "✗"} Docker:${q.hasDockerfile ? "✓" : "✗"} | ${q.fileCount} files`
            )
            .join("\n")}

=== TOP REPO FILE TREE ===
${data.topRepoTree ? data.topRepoTree.join("\n") : "Could not fetch."}

=== TOP REPO README ===
${data.topRepoReadme || "No README found."}

Respond ONLY with the JSON object. Be brutally specific — reference actual repos and data points in every field.`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
        throw new Error("Groq returned empty response");
    }

    const parsed = JSON.parse(content) as AnalysisResult;

    // Validate required fields
    if (
        typeof parsed.score !== "number" ||
        typeof parsed.headline !== "string" ||
        !Array.isArray(parsed.red_flags) ||
        !Array.isArray(parsed.green_flags) ||
        typeof parsed.readme_score !== "number" ||
        !Array.isArray(parsed.improvement_plan)
    ) {
        throw new Error("Groq response did not match expected schema");
    }

    // Clamp scores and provide defaults
    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    parsed.readme_score = Math.max(0, Math.min(10, Math.round(parsed.readme_score)));
    parsed.code_quality_score = Math.max(0, Math.min(10, Math.round(parsed.code_quality_score ?? 5)));
    parsed.consistency_score = Math.max(0, Math.min(10, Math.round(parsed.consistency_score ?? 5)));
    parsed.diversity_score = Math.max(0, Math.min(10, Math.round(parsed.diversity_score ?? 5)));
    parsed.summary = parsed.summary ?? "No summary available.";
    parsed.seniority_estimate = parsed.seniority_estimate ?? "Unknown";
    parsed.strongest_project = parsed.strongest_project ?? "No standout project identified.";
    parsed.biggest_gap = parsed.biggest_gap ?? "No major gaps identified.";
    parsed.tech_stack_verdict = parsed.tech_stack_verdict ?? "No assessment available.";
    parsed.commit_verdict = parsed.commit_verdict ?? "No assessment available.";

    // Enforce max limits
    parsed.red_flags = (parsed.red_flags || []).slice(0, 4);
    parsed.green_flags = (parsed.green_flags || []).slice(0, 4);
    parsed.improvement_plan = (parsed.improvement_plan || []).slice(0, 5);

    return parsed;
}
