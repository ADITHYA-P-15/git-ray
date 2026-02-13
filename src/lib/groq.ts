import Groq from "groq-sdk";
import { GitHubData } from "./github";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface AnalysisResult {
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

export async function analyzeWithGroq(
    data: GitHubData
): Promise<AnalysisResult> {
    const systemPrompt = `You are a brutal, high-standards Tech Recruiter and Engineering Manager at a FAANG company. You are conducting a deep technical review of a candidate's GitHub portfolio. You evaluate not just "what they built" but HOW they build — their engineering practices, consistency, documentation discipline, testing habits, CI/CD maturity, and tech diversity. Be direct, data-driven, slightly harsh, but constructive. You must respond ONLY with a valid JSON object.`;

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

    const userPrompt = `Analyze this GitHub profile with DEEP technical scrutiny. Return a JSON object strictly matching this schema:
{
  "score": <number 0-100, overall employability score>,
  "headline": <string, a catchy one-liner like "Solid Engineer, Zero DevOps" or "Polyglot Builder, Needs More Tests">,
  "red_flags": <string[], specific concerning findings backed by data, max 6>,
  "green_flags": <string[], specific positive signals backed by data, max 6>,
  "readme_score": <number 0-10, quality of top repo README — consider structure, badges, install instructions, screenshots>,
  "code_quality_score": <number 0-10, based on CI/CD, testing, linting, .gitignore, project structure>,
  "consistency_score": <number 0-10, based on commit frequency, recency, account age vs activity>,
  "diversity_score": <number 0-10, based on language variety, tech stack breadth, different project types>,
  "improvement_plan": <string[], specific actionable suggestions referencing actual repos by name, max 6>,
  "tech_stack_verdict": <string, 1-2 sentence assessment of their technology choices and breadth>,
  "commit_verdict": <string, 1-2 sentence assessment of their commit consistency and activity level>
}

=== CANDIDATE DATA ===

**Profile:**
- Username: ${data.user.login}
- Name: ${data.user.name || "Not set"}
- Bio: ${data.user.bio || "No bio set"}
- Company: ${data.user.company || "None"}
- Location: ${data.user.location || "Unknown"}
- Public Repos: ${data.user.public_repos}
- Followers: ${data.user.followers} | Following: ${data.user.following}
- Account Age: ${data.accountAgeDays} days (${(data.accountAgeDays / 365).toFixed(1)} years)
- Total Stars (all repos): ${data.totalStars}
- Total Forks (all repos): ${data.totalForks}

**Language Distribution (across ${Object.keys(data.languageStats).length} languages):**
${topLanguages.length > 0 ? topLanguages.join("\n") : "No language data available"}

**Top Repositories:**
${data.repos
            .map(
                (r, i) => `${i + 1}. **${r.name}** — ${r.description || "No description"}
   Language: ${r.language || "N/A"} | ⭐ ${r.stargazers_count} | 🍴 ${r.forks_count} | Issues: ${r.open_issues_count}
   License: ${r.license?.name || "NONE"} | README: ${r.has_readme ? "✅" : "❌"}
   Topics: ${r.topics.length > 0 ? r.topics.join(", ") : "None tagged"}
   Last Updated: ${r.updated_at}`
            )
            .join("\n")}

**Commit Activity (last 30 days):**
Total recent commits across repos: ${totalRecentCommits}
${data.commitActivity
            .map(
                (c) =>
                    `- ${c.repo}: ${c.recentCommits} commits (last 30d) | Last commit: ${c.lastCommitDate || "Unknown"}`
            )
            .join("\n")}

**Code Quality Signals (per repo):**
Repos with CI/CD: ${reposWithCI}/${data.codeQuality.length}
Repos with Tests: ${reposWithTests}/${data.codeQuality.length}
Repos with Linting: ${reposWithLinting}/${data.codeQuality.length}
Repos with Docs folder: ${reposWithDocs}/${data.codeQuality.length}
${data.codeQuality
            .map(
                (q) =>
                    `- ${q.repo}: CI:${q.hasCI ? "✅" : "❌"} Tests:${q.hasTests ? "✅" : "❌"} Lint:${q.hasLinting ? "✅" : "❌"} .gitignore:${q.hasGitignore ? "✅" : "❌"} Docker:${q.hasDockerfile ? "✅" : "❌"} Docs:${q.hasDocs ? "✅" : "❌"} CONTRIBUTING:${q.hasContributing ? "✅" : "❌"} | ${q.fileCount} files`
            )
            .join("\n")}

**Top Repo (#1) File Tree:**
${data.topRepoTree ? data.topRepoTree.join("\n") : "Could not fetch."}

**Top Repo (#1) README Content:**
${data.topRepoReadme || "No README found."}

Respond ONLY with the JSON object. Be specific — reference actual repo names and data points.`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
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
    parsed.tech_stack_verdict = parsed.tech_stack_verdict ?? "No assessment available.";
    parsed.commit_verdict = parsed.commit_verdict ?? "No assessment available.";

    return parsed;
}
