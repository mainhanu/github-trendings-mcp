import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { languages, languageSet } from "./resources/languages";
import { popularLanguages } from "./resources/popularLanguages";
import { getTrendingRepos } from "./trending";
import { getPromptTemplate } from "./prompt";

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

Common language abbreviations: ts=typescript, js=javascript, py=python, rb=ruby, go=golang`,
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

    const repos = await getTrendingRepos({ lang, range });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              language: lang,
              range: range || "daily",
              count: repos.length,
              repositories: repos,
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
        ),
      range: z
        .enum(["daily", "weekly", "monthly"])
        .optional()
        .describe(
          "Time range for trending: 'daily' (default), 'weekly' (this week), or 'monthly' (this month)"
        ),
    },
  },
  async ({ language, range }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: getPromptTemplate(language ?? "", range ?? "daily"),
          },
        },
      ],
    };
  }
);
