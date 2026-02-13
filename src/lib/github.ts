import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
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
  created_at: string;
}

export interface CommitActivity {
  repo: string;
  totalCommits: number;
  recentCommits: number; // last 30 days
  lastCommitDate: string | null;
}

export interface CodeQualitySignals {
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
  directoryStructure: string[];
}

export interface LanguageStats {
  [language: string]: number; // bytes
}

export interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  topRepoTree: string[] | null;
  topRepoReadme: string | null;
  commitActivity: CommitActivity[];
  codeQuality: CodeQualitySignals[];
  languageStats: LanguageStats;
  totalStars: number;
  totalForks: number;
  accountAgeDays: number;
}

export class GitHubNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub user "${username}" not found`);
    this.name = "GitHubNotFoundError";
  }
}

export async function fetchGitHubData(
  username: string
): Promise<GitHubData> {
  // 1. Fetch user profile
  let userResponse;
  try {
    userResponse = await octokit.rest.users.getByUsername({ username });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      throw new GitHubNotFoundError(username);
    }
    throw error;
  }

  const user: GitHubUser = {
    login: userResponse.data.login,
    name: userResponse.data.name,
    avatar_url: userResponse.data.avatar_url,
    bio: userResponse.data.bio,
    company: userResponse.data.company,
    location: userResponse.data.location,
    blog: userResponse.data.blog,
    public_repos: userResponse.data.public_repos,
    followers: userResponse.data.followers,
    following: userResponse.data.following,
    created_at: userResponse.data.created_at,
  };

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 2. Fetch repos (sorted by updated, take top 30, re-sort by stars)
  const reposResponse = await octokit.rest.repos.listForUser({
    username,
    sort: "updated",
    per_page: 30,
    type: "owner",
  });

  const allRepos = reposResponse.data.filter((r) => !r.fork);
  const sortedRepos = [...allRepos]
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, 6); // Take top 6 instead of 4 for better coverage

  // 3. Compute aggregate stats
  const totalStars = allRepos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
  const totalForks = allRepos.reduce((sum, r) => sum + (r.forks_count ?? 0), 0);

  // 4. Aggregate language stats across ALL repos
  const languageStats: LanguageStats = {};
  await Promise.all(
    allRepos.slice(0, 15).map(async (repo) => {
      try {
        const langResponse = await octokit.rest.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });
        for (const [lang, bytes] of Object.entries(langResponse.data)) {
          languageStats[lang] = (languageStats[lang] || 0) + bytes;
        }
      } catch {
        // Skip repos where languages can't be fetched
      }
    })
  );

  // 5. Check for READMEs, fetch commit activity, and analyze file trees
  const repos: GitHubRepo[] = [];
  const commitActivity: CommitActivity[] = [];
  const codeQuality: CodeQualitySignals[] = [];

  await Promise.all(
    sortedRepos.map(async (repo) => {
      // Check README
      let has_readme = false;
      try {
        await octokit.rest.repos.getReadme({ owner: username, repo: repo.name });
        has_readme = true;
      } catch {
        has_readme = false;
      }

      repos.push({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language ?? null,
        stargazers_count: repo.stargazers_count ?? 0,
        forks_count: repo.forks_count ?? 0,
        open_issues_count: repo.open_issues_count ?? 0,
        topics: repo.topics ?? [],
        has_readme,
        license: repo.license ? { name: repo.license.name ?? "Unknown" } : null,
        updated_at: repo.updated_at ?? "",
        created_at: repo.created_at ?? "",
      });

      // Fetch commit activity (last 30 days vs total)
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [allCommits, recentCommits] = await Promise.all([
          octokit.rest.repos.listCommits({
            owner: username,
            repo: repo.name,
            per_page: 1,
          }),
          octokit.rest.repos.listCommits({
            owner: username,
            repo: repo.name,
            since: thirtyDaysAgo,
            per_page: 100,
          }),
        ]);

        const lastCommitDate = allCommits.data[0]?.commit?.committer?.date ?? null;

        commitActivity.push({
          repo: repo.name,
          totalCommits: allCommits.data.length > 0 ? 1 : 0, // At least 1
          recentCommits: recentCommits.data.length,
          lastCommitDate,
        });
      } catch {
        commitActivity.push({
          repo: repo.name,
          totalCommits: 0,
          recentCommits: 0,
          lastCommitDate: null,
        });
      }

      // Fetch file tree for code quality analysis
      try {
        const repoInfo = await octokit.rest.repos.get({
          owner: username,
          repo: repo.name,
        });
        const treeResponse = await octokit.rest.git.getTree({
          owner: username,
          repo: repo.name,
          tree_sha: repoInfo.data.default_branch,
          recursive: "1",
        });

        const files = treeResponse.data.tree
          .filter((item) => item.type === "blob")
          .map((item) => item.path ?? "")
          .filter(Boolean);

        const dirs = treeResponse.data.tree
          .filter((item) => item.type === "tree")
          .map((item) => item.path ?? "")
          .filter(Boolean);

        const allPaths = [...files, ...dirs].map((p) => p.toLowerCase());

        const ciPatterns = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci", ".travis.yml"];
        const testPatterns = ["test", "tests", "__tests__", "spec", "specs", ".test.", ".spec."];
        const lintPatterns = [".eslintrc", ".eslintrc.js", ".eslintrc.json", "eslint.config", ".prettierrc", ".pylintrc", "pyproject.toml", ".flake8", "biome.json"];
        const docPatterns = ["docs", "documentation", "doc"];

        codeQuality.push({
          repo: repo.name,
          hasCI: ciPatterns.some((p) => allPaths.some((f) => f.includes(p.toLowerCase()))),
          hasTests: testPatterns.some((p) => allPaths.some((f) => f.includes(p.toLowerCase()))),
          hasDocs: docPatterns.some((p) => allPaths.some((f) => f.startsWith(p))),
          hasLinting: lintPatterns.some((p) => allPaths.some((f) => f.includes(p.toLowerCase()))),
          hasGitignore: allPaths.includes(".gitignore"),
          hasContributing: allPaths.some((f) => f.includes("contributing")),
          hasChangelog: allPaths.some((f) => f.includes("changelog")),
          hasDotGithub: allPaths.some((f) => f.startsWith(".github")),
          hasEnvExample: allPaths.some((f) => f.includes(".env.example") || f.includes(".env.sample")),
          hasDockerfile: allPaths.some((f) => f.includes("dockerfile")),
          fileCount: files.length,
          directoryStructure: dirs.slice(0, 15),
        });
      } catch {
        codeQuality.push({
          repo: repo.name,
          hasCI: false, hasTests: false, hasDocs: false, hasLinting: false,
          hasGitignore: false, hasContributing: false, hasChangelog: false,
          hasDotGithub: false, hasEnvExample: false, hasDockerfile: false,
          fileCount: 0, directoryStructure: [],
        });
      }
    })
  );

  // Sort repos back by stars
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

  // 6. Deep dive into top repo: file tree + README
  let topRepoTree: string[] | null = null;
  let topRepoReadme: string | null = null;

  if (repos.length > 0) {
    const topRepo = repos[0];

    // Use the already-fetched tree from codeQuality
    const topQuality = codeQuality.find((q) => q.repo === topRepo.name);
    if (topQuality && topQuality.directoryStructure.length > 0) {
      try {
        const repoInfo = await octokit.rest.repos.get({
          owner: username,
          repo: topRepo.name,
        });
        const treeResponse = await octokit.rest.git.getTree({
          owner: username,
          repo: topRepo.name,
          tree_sha: repoInfo.data.default_branch,
          recursive: "1",
        });
        topRepoTree = treeResponse.data.tree
          .filter((item) => item.type === "blob")
          .map((item) => item.path ?? "")
          .filter(Boolean)
          .slice(0, 50);
      } catch {
        topRepoTree = null;
      }
    }

    // Fetch README content
    try {
      const readmeResponse = await octokit.rest.repos.getReadme({
        owner: username,
        repo: topRepo.name,
        mediaType: { format: "raw" },
      });
      const readmeContent =
        typeof readmeResponse.data === "string"
          ? readmeResponse.data
          : Buffer.from(readmeResponse.data as unknown as ArrayBuffer).toString("utf-8");
      topRepoReadme = readmeContent.slice(0, 3000);
    } catch {
      topRepoReadme = null;
    }
  }

  return {
    user, repos, topRepoTree, topRepoReadme,
    commitActivity, codeQuality, languageStats,
    totalStars, totalForks, accountAgeDays,
  };
}
