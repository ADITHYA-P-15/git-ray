import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubData, GitHubNotFoundError } from "@/lib/github";
import { analyzeWithGroq } from "@/lib/groq";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username || typeof username !== "string") {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");

        if (!sanitizedUsername) {
            return NextResponse.json(
                { error: "Invalid username format" },
                { status: 400 }
            );
        }

        // Fetch GitHub data
        const githubData = await fetchGitHubData(sanitizedUsername);

        // Analyze with Groq
        const analysis = await analyzeWithGroq(githubData);

        return NextResponse.json({
            user: githubData.user,
            repos: githubData.repos,
            analysis,
            commitActivity: githubData.commitActivity,
            codeQuality: githubData.codeQuality,
            languageStats: githubData.languageStats,
            totalStars: githubData.totalStars,
            totalForks: githubData.totalForks,
            accountAgeDays: githubData.accountAgeDays,
        });
    } catch (error) {
        if (error instanceof GitHubNotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze profile. Please try again." },
            { status: 500 }
        );
    }
}
