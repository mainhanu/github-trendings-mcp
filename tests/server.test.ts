import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { server } from "../src/server";

const MOCK_TRENDING_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div>
    <article class="Box-row">
      <h2><a href="/facebook/react">facebook / react</a></h2>
      <p>A declarative, efficient, and flexible JavaScript library for building user interfaces.</p>
      <div class="f6">
        <span itemprop="programmingLanguage">JavaScript</span>
        <a data-view-component="true" href="/facebook/react/stargazers">228,000</a>
        <a data-view-component="true" href="/facebook/react/forks">46,500</a>
        <span class="float-sm-right">1,234 stars today</span>
      </div>
    </article>
  </div>
</body>
</html>
`;

function getTextContent(
  content: { uri: string; text: string } | { uri: string; blob: string }
): string {
  if ("text" in content) {
    return content.text;
  }
  throw new Error("Expected text content but got blob");
}

function getToolTextContent(result: Awaited<ReturnType<typeof Client.prototype.callTool>>): string {
  const content = result.content as Array<{ type: string; text?: string }>;
  if (content.length > 0 && content[0].type === "text" && content[0].text) {
    return content[0].text;
  }
  throw new Error("Expected text content from tool result");
}

function mockFetch(html: string) {
  global.fetch = vi.fn().mockResolvedValue({
    text: () => Promise.resolve(html),
  });
}

describe("GitHub Trending MCP Server", () => {
  let client: Client;

  beforeAll(async () => {
    // 创建 InMemoryTransport 进行测试
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // 创建 MCP Client
    client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    // 连接 server 和 client
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  describe("Server Info", () => {
    it("should return correct server info", async () => {
      const serverInfo = client.getServerVersion();
      expect(serverInfo?.name).toBe("GitHub Trending Repositories Tracker");
      expect(serverInfo?.version).toBe("0.0.1");
    });
  });

  describe("Resources", () => {
    it("should list available resources", async () => {
      const resources = await client.listResources();
      expect(resources.resources).toBeDefined();
      expect(resources.resources.length).toBeGreaterThan(0);

      const languageResource = resources.resources.find(
        (r) => r.uri === "github-trending://languages"
      );
      expect(languageResource).toBeDefined();
      expect(languageResource?.name).toBe("language-list");
    });

    it("should read language-list resource and return popular languages", async () => {
      const result = await client.readResource({
        uri: "github-trending://languages",
      });

      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(2);

      // 检查 popular languages
      const popularContent = result.contents.find((c) =>
        c.uri?.includes("#popular")
      );
      expect(popularContent).toBeDefined();
      expect(popularContent?.mimeType).toBe("application/json");

      const popularData = JSON.parse(getTextContent(popularContent!));
      expect(Array.isArray(popularData)).toBe(true);
      expect(popularData.length).toBeGreaterThan(0);
    });

    it("should read language-list resource and return all languages", async () => {
      const result = await client.readResource({
        uri: "github-trending://languages",
      });

      // 检查 all languages
      const allContent = result.contents.find((c) => c.uri?.includes("#all"));
      expect(allContent).toBeDefined();
      expect(allContent?.mimeType).toBe("application/json");

      const allData = JSON.parse(getTextContent(allContent!));
      expect(Array.isArray(allData)).toBe(true);
      expect(allData.length).toBeGreaterThan(100); // 应该有很多语言
    });

    it("should have valid language data structure", async () => {
      const result = await client.readResource({
        uri: "github-trending://languages",
      });

      const allContent = result.contents.find((c) => c.uri?.includes("#all"));
      const allData = JSON.parse(getTextContent(allContent!));

      // 每个语言应该是 [name, color] 格式
      allData.forEach((lang: [string, string | null]) => {
        expect(typeof lang[0]).toBe("string");
        expect(lang[0].length).toBeGreaterThan(0);
        // color 可以是 string 或 null
        expect(lang[1] === null || typeof lang[1] === "string").toBe(true);
      });
    });
  });

  describe("Popular Languages", () => {
    it("should contain common programming languages", async () => {
      const result = await client.readResource({
        uri: "github-trending://languages",
      });

      const popularContent = result.contents.find((c) =>
        c.uri?.includes("#popular")
      );
      const popularData = JSON.parse(getTextContent(popularContent!));
      const languageNames = popularData.map((lang: [string, string]) => lang[0]);

      expect(languageNames).toContain("Python");
      expect(languageNames).toContain("JavaScript");
      expect(languageNames).toContain("TypeScript");
      expect(languageNames).toContain("Java");
      expect(languageNames).toContain("Go");
      expect(languageNames).toContain("Rust");
    });

    it("popular languages should be a subset of all languages", async () => {
      const result = await client.readResource({
        uri: "github-trending://languages",
      });

      const popularContent = result.contents.find((c) =>
        c.uri?.includes("#popular")
      );
      const allContent = result.contents.find((c) => c.uri?.includes("#all"));

      const popularData = JSON.parse(getTextContent(popularContent!));
      const allData = JSON.parse(getTextContent(allContent!));

      const allLanguageNames = new Set(
        allData.map((lang: [string, string]) => lang[0])
      );

      popularData.forEach((lang: [string, string]) => {
        expect(allLanguageNames.has(lang[0])).toBe(true);
      });
    });
  });

  describe("Prompts", () => {
    it("should list available prompts", async () => {
      const prompts = await client.listPrompts();
      expect(prompts.prompts).toBeDefined();
      expect(prompts.prompts.length).toBeGreaterThan(0);

      const analyzePrompt = prompts.prompts.find(
        (p) => p.name === "analyze_github_trending"
      );
      expect(analyzePrompt).toBeDefined();
      expect(analyzePrompt?.description).toContain("Analyze trending repositories");

      const repoAnalyzePrompt = prompts.prompts.find(
        (p) => p.name === "analyze_repository"
      );
      expect(repoAnalyzePrompt).toBeDefined();
      expect(repoAnalyzePrompt?.description).toContain("comprehensive analysis");
    });

    it("should get analyze_github_trending prompt with arguments", async () => {
      const result = await client.getPrompt({
        name: "analyze_github_trending",
        arguments: { language: "typescript", range: "weekly" },
      });

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe("user");

      const content = result.messages[0].content;
      expect(content.type).toBe("text");
      // Check for key content in the prompt template
      expect((content as { type: "text"; text: string }).text).toContain("GitHub Trending");
      expect((content as { type: "text"; text: string }).text).toContain("typescript");
    });

    it("should use default range when not specified", async () => {
      const result = await client.getPrompt({
        name: "analyze_github_trending",
        arguments: { language: "python" },
      });

      const content = result.messages[0].content;
      expect((content as { type: "text"; text: string }).text).toContain("daily");
    });

    it("should get analyze_repository prompt with repository argument", async () => {
      const result = await client.getPrompt({
        name: "analyze_repository",
        arguments: { repository: "facebook/react" },
      });

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe("user");

      const content = result.messages[0].content;
      expect(content.type).toBe("text");
      expect((content as { type: "text"; text: string }).text).toContain("facebook/react");
      expect((content as { type: "text"; text: string }).text).toContain("Repository Analysis");
      expect((content as { type: "text"; text: string }).text).toContain("Core Features");
      expect((content as { type: "text"; text: string }).text).toContain("Real-World Use Cases");
    });
  });

  describe("Tools", () => {
    it("should list available tools", async () => {
      const tools = await client.listTools();
      expect(tools.tools).toBeDefined();
      expect(tools.tools.length).toBeGreaterThan(0);

      const trendingTool = tools.tools.find(
        (t) => t.name === "github_trending"
      );
      expect(trendingTool).toBeDefined();
      expect(trendingTool?.description).toContain("GitHub Trending");
    });

    it("should call github_trending tool with valid language", async () => {
      mockFetch(MOCK_TRENDING_HTML);

      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "javascript" },
      });

      const data = JSON.parse(getToolTextContent(result));
      expect(data.language).toBe("javascript");
      expect(data.range).toBe("daily");
      // New structure with newRepositories and seenRepositories
      expect(data.newRepositories).toBeDefined();
      expect(data.newRepositories.repositories).toBeDefined();
      expect(Array.isArray(data.newRepositories.repositories)).toBe(true);
      expect(data.seenRepositories).toBeDefined();
      expect(data.trendAnalysis).toBeDefined();
    });

    it("should return null language for invalid language", async () => {
      mockFetch(MOCK_TRENDING_HTML);

      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "invalid-language-xyz" },
      });

      const data = JSON.parse(getToolTextContent(result));
      expect(data.language).toBeNull();
    });

    it("should return repositories with correct structure", async () => {
      mockFetch(MOCK_TRENDING_HTML);

      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "javascript" },
      });

      const data = JSON.parse(getToolTextContent(result));
      // Get all repos from newRepositories
      const allNewRepos = data.newRepositories.repositories;
      expect(allNewRepos.length).toBeGreaterThan(0);

      const repo = allNewRepos[0];
      expect(repo).toHaveProperty("full_name");
      expect(repo).toHaveProperty("description");
      expect(repo).toHaveProperty("language");
      expect(repo).toHaveProperty("stargazers_count");
      expect(repo).toHaveProperty("forks_count");
      expect(repo).toHaveProperty("stargazers_add");
      expect(repo).toHaveProperty("users");
    });

    it("should handle language abbreviations", async () => {
      mockFetch(MOCK_TRENDING_HTML);

      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "ts" },
      });

      const data = JSON.parse(getToolTextContent(result));
      expect(data.language).toBe("typescript");
    });

    it("should support different time ranges", async () => {
      mockFetch(MOCK_TRENDING_HTML);

      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "python", range: "weekly" },
      });

      const data = JSON.parse(getToolTextContent(result));
      expect(data.range).toBe("weekly");
    });
  });

  describe("Trending Repositories (Real Network)", () => {
    it("should fetch real trending repositories from GitHub", async () => {
      const result = await client.callTool({
        name: "github_trending",
        arguments: { language: "typescript" },
      });

      const data = JSON.parse(getToolTextContent(result));
      expect(data.language).toBe("typescript");
      expect(data.newRepositories).toBeDefined();
      expect(Array.isArray(data.newRepositories.repositories)).toBe(true);

      // All repos should be in either newRepositories or seenRepositories
      const allRepos = [
        ...data.newRepositories.repositories,
        ...data.seenRepositories.repositories,
      ];

      if (allRepos.length > 0) {
        const repo = data.newRepositories.repositories[0] || data.seenRepositories.repositories[0];
        expect(typeof repo.full_name).toBe("string");
        expect(repo.full_name).toMatch(/^[^/]+\/[^/]+$/);
      }

      // Check trend analysis structure
      expect(data.trendAnalysis).toBeDefined();
      expect(typeof data.trendAnalysis.hasSufficientData).toBe("boolean");
      expect(typeof data.trendAnalysis.analysisNote).toBe("string");
    }, 30000);
  });
});
