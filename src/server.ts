import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { languages, languageSet } from "./resources/languages";
import { popularLanguages } from "./resources/popularLanguages";
import { getTrendingRepos } from "./trending";
import { getPromptTemplate, getRepoAnalysisPromptTemplate } from "./prompt";
import {
  saveTrendingToCache,
  separateNewAndSeenRepos,
  analyzeTrend,
  type TrendAnalysisData,
} from "./cache";

export const server = new McpServer({
  name: "GitHub Trending Repositories Tracker",
  version: "0.0.1",
  description:
    "See what the GitHub community is most excited about by tracking repositories with language filter",
});

server.registerResource(
  "language-list",
  "github-trending://languages",
  {
    title: "Programming Languages List",
    description:
      "Get a list of programming languages used in GitHub trending repositorie, including popular list and all languages list",
    mimeType: "application/json",
  },
  async (url) => {
    return {
      contents: [
        {
          uri: `${url}#popular`,
          mimeType: "application/json",
          text: JSON.stringify(popularLanguages),
        },
        {
          uri: `${url}#all`,
          mimeType: "application/json",
          text: JSON.stringify(languages),
        },
      ],
    };
  }
);

// Register tool for getting trending repositories
server.registerTool(
  "github_trending",
  {
    description: `Fetch GitHub Trending repositories. Use this tool when users ask about:
- GitHub trending/hot/popular repositories
- What's trending on GitHub today/this week/this month
- Popular open source projects
- Trending repos for specific languages (e.g., "ts trending", "python hot repos", "rust github trending")

Common language abbreviations: ts=typescript, js=javascript, py=python, rb=ruby, go=golang

This tool also provides:
- Cache-based trend analysis (if sufficient historical data available)
- Identification of new repos vs recently seen repos (within 3 days)`,
    inputSchema: {
      language: z
        .string()
        .optional()
        .describe(
          "Programming language to filter by. Supports full names (typescript, javascript, python) and common abbreviations (ts, js, py). Leave empty for all languages."
        ),
      range: z
        .enum(["daily", "weekly", "monthly"])
        .optional()
        .default("daily")
        .describe(
          "Time range: 'daily' (today), 'weekly' (this week), or 'monthly' (this month)"
        ),
    },
  },
  async ({ language, range }) => {
    // Handle common language abbreviations
    const langMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      cs: "c#",
      cpp: "c++",
    };

    let normalizedLang = language?.toLowerCase();
    if (normalizedLang && langMap[normalizedLang]) {
      normalizedLang = langMap[normalizedLang];
    }

    const lang =
      normalizedLang && languageSet.has(normalizedLang) ? normalizedLang : null;
    const effectiveRange = range || "daily";

    const repos = await getTrendingRepos({ lang, range: effectiveRange });

    // 保存到缓存
    saveTrendingToCache(repos, lang, effectiveRange);

    // 分离新 repo 和已见过的 repo
    const { newRepos, seenRepos, seenRepoNames } = separateNewAndSeenRepos(
      repos,
      lang,
      effectiveRange
    );

    // 分析趋势
    const trendAnalysis: TrendAnalysisData = analyzeTrend(repos, lang, effectiveRange);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              language: lang,
              range: effectiveRange,
              count: repos.length,
              // 需要分析的新 repo（3天内未见过）
              newRepositories: {
                count: newRepos.length,
                note: "These repos have NOT appeared in trending within the last 3 days. Focus analysis on these.",
                repositories: newRepos,
              },
              // 已见过的 repo（3天内出现过，不需要详细分析）
              seenRepositories: {
                count: seenRepos.length,
                note: "These repos have appeared in trending within the last 3 days. No need for detailed analysis, just list them.",
                repositories: seenRepos.map((r) => ({
                  full_name: r.full_name,
                  stargazers_count: r.stargazers_count,
                  stargazers_add: r.stargazers_add,
                })),
              },
              // 趋势分析
              trendAnalysis: {
                hasSufficientData: trendAnalysis.hasSufficientData,
                analysisNote: trendAnalysis.analysisNote,
                // 仅在有足够数据时提供详细分析
                ...(trendAnalysis.hasSufficientData
                  ? {
                      persistentTrending: trendAnalysis.persistentTrending,
                      newEntrants: trendAnalysis.newEntrants,
                      droppedOff: trendAnalysis.droppedOff,
                      dataPointsSummary: trendAnalysis.dataPoints.map((dp) => ({
                        date: dp.date,
                        repoCount: dp.repoCount,
                      })),
                    }
                  : {}),
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerPrompt(
  "analyze_github_trending",
  {
    title: "Analyze GitHub Trending Repositories",
    description:
      "Analyze trending repositories on GitHub for a specific programming language and time range. Returns structured analysis with overview table, detailed insights for top repos, and trend summary.",
    argsSchema: {
      language: z
        .string()
        .optional()
        .describe(
          "Programming language to analyze (e.g., typescript, python, rust). Leave empty for all languages."
        )
    },
  },
  async ({ language }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: getPromptTemplate(language ?? "", "daily"),
          },
        },
      ],
    };
  }
);

server.registerPrompt(
  "analyze_repository",
  {
    title: "Analyze GitHub Repository",
    description:
      "Conduct a comprehensive analysis of a specific GitHub repository. Analyzes README, issues, and community feedback to understand the project's purpose, core features, use cases, architecture, and adoption.",
    argsSchema: {
      repository: z
        .string()
        .describe(
          "Repository to analyze. Can be full URL (https://github.com/owner/repo) or short form (owner/repo)"
        ),
    },
  },
  async ({ repository }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: getRepoAnalysisPromptTemplate(repository),
          },
        },
      ],
    };
  }
);
