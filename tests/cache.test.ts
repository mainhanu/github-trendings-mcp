import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Mock modules before importing cache
vi.mock("fs");
vi.mock("os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

// Now import cache module after mocks are set up
const { 
  saveTrendingToCache,
  getHistoricalCache,
  findSeenRepos,
  analyzeTrend,
  separateNewAndSeenRepos,
} = await import("../src/cache");

const CACHE_DIR = "/mock/home/.github-trending-mcp";
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

const mockRepo = (name: string, stars = 1000) => ({
  full_name: name,
  description: `Description for ${name}`,
  language: "TypeScript",
  stargazers_count: stars,
  forks_count: 100,
  stargazers_add: 50,
  users: [],
});

describe("Cache Module", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveTrendingToCache", () => {
    it("should create cache directory and save data when cache does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const repos = [mockRepo("owner/repo1"), mockRepo("owner/repo2")];
      saveTrendingToCache(repos, "typescript", "daily");

      expect(fs.mkdirSync).toHaveBeenCalledWith(CACHE_DIR, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.entries).toHaveLength(1);
      expect(writtenData.entries[0].language).toBe("typescript");
      expect(writtenData.entries[0].range).toBe("daily");
      expect(writtenData.entries[0].repos).toHaveLength(2);
    });

    it("should update existing cache entry if repo list is the same", () => {
      const existingTimestamp = Date.now() - 3600000; // 1 hour ago
      const existingCache = {
        entries: [
          {
            timestamp: existingTimestamp,
            language: "typescript",
            range: "daily",
            repos: [mockRepo("owner/repo1"), mockRepo("owner/repo2")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingCache));

      const repos = [mockRepo("owner/repo1"), mockRepo("owner/repo2")];
      saveTrendingToCache(repos, "typescript", "daily");

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      // Should still have only 1 entry (updated, not added)
      expect(writtenData.entries).toHaveLength(1);
      // Timestamp should be updated
      expect(writtenData.entries[0].timestamp).toBeGreaterThan(existingTimestamp);
    });

    it("should add new cache entry if repo list is different", () => {
      const existingTimestamp = Date.now() - 3600000;
      const existingCache = {
        entries: [
          {
            timestamp: existingTimestamp,
            language: "typescript",
            range: "daily",
            repos: [mockRepo("owner/repo1"), mockRepo("owner/repo2")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingCache));

      // Different repo list
      const repos = [mockRepo("owner/repo1"), mockRepo("owner/repo3")];
      saveTrendingToCache(repos, "typescript", "daily");

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      // Should have 2 entries now
      expect(writtenData.entries).toHaveLength(2);
    });

    it("should handle different languages independently", () => {
      const existingCache = {
        entries: [
          {
            timestamp: Date.now() - 3600000,
            language: "typescript",
            range: "daily",
            repos: [mockRepo("owner/repo1")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingCache));

      const repos = [mockRepo("owner/repo2")];
      saveTrendingToCache(repos, "python", "daily");

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.entries).toHaveLength(2);
    });
  });

  describe("getHistoricalCache", () => {
    it("should return empty array when no cache exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getHistoricalCache("typescript", "daily");
      expect(result).toEqual([]);
    });

    it("should filter entries by language and range", () => {
      const cache = {
        entries: [
          {
            timestamp: Date.now() - 1000,
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/ts-repo")],
          },
          {
            timestamp: Date.now() - 2000,
            language: "python",
            range: "daily" as const,
            repos: [mockRepo("owner/py-repo")],
          },
          {
            timestamp: Date.now() - 3000,
            language: "typescript",
            range: "weekly" as const,
            repos: [mockRepo("owner/ts-weekly")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const result = getHistoricalCache("typescript", "daily");
      expect(result).toHaveLength(1);
      expect(result[0].repos[0].full_name).toBe("owner/ts-repo");
    });

    it("should filter by withinDays parameter", () => {
      const cache = {
        entries: [
          {
            timestamp: Date.now() - 1000, // recent
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/recent")],
          },
          {
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/old")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const result = getHistoricalCache("typescript", "daily", 3);
      expect(result).toHaveLength(1);
      expect(result[0].repos[0].full_name).toBe("owner/recent");
    });
  });

  describe("findSeenRepos", () => {
    it("should return empty set when no history", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = findSeenRepos(
        [mockRepo("owner/repo1")],
        "typescript",
        "daily"
      );
      expect(result.size).toBe(0);
    });

    it("should return repos seen in recent history", () => {
      const cache = {
        entries: [
          {
            timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago (not too recent)
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/seen-repo"), mockRepo("owner/another-seen")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const result = findSeenRepos(
        [mockRepo("owner/seen-repo"), mockRepo("owner/new-repo")],
        "typescript",
        "daily"
      );

      expect(result.has("owner/seen-repo")).toBe(true);
      expect(result.has("owner/another-seen")).toBe(true);
      expect(result.has("owner/new-repo")).toBe(false);
    });
  });

  describe("separateNewAndSeenRepos", () => {
    it("should separate repos into new and seen categories", () => {
      const cache = {
        entries: [
          {
            timestamp: Date.now() - 2 * 60 * 1000,
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/seen-repo")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const currentRepos = [
        mockRepo("owner/seen-repo"),
        mockRepo("owner/new-repo"),
      ];

      const result = separateNewAndSeenRepos(currentRepos, "typescript", "daily");

      expect(result.newRepos).toHaveLength(1);
      expect(result.newRepos[0].full_name).toBe("owner/new-repo");
      expect(result.seenRepos).toHaveLength(1);
      expect(result.seenRepos[0].full_name).toBe("owner/seen-repo");
    });
  });

  describe("analyzeTrend", () => {
    it("should indicate insufficient data when no history", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = analyzeTrend([mockRepo("owner/repo")], "typescript", "daily");

      expect(result.hasSufficientData).toBe(false);
      expect(result.analysisNote).toContain("No historical data");
    });

    it("should indicate insufficient data with only one day of data", () => {
      const cache = {
        entries: [
          {
            timestamp: Date.now() - 1000,
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/repo")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const result = analyzeTrend([mockRepo("owner/repo")], "typescript", "daily");

      expect(result.hasSufficientData).toBe(false);
      expect(result.analysisNote).toContain("1 day(s) of data");
    });

    it("should analyze trends with sufficient data", () => {
      const day1 = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      const day2 = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago

      const cache = {
        entries: [
          {
            timestamp: day1,
            language: "typescript",
            range: "daily" as const,
            repos: [
              mockRepo("owner/persistent"),
              mockRepo("owner/dropped"),
            ],
          },
          {
            timestamp: day2,
            language: "typescript",
            range: "daily" as const,
            repos: [
              mockRepo("owner/persistent"),
              mockRepo("owner/dropped"),
            ],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const currentRepos = [
        mockRepo("owner/persistent"),
        mockRepo("owner/new-entrant"),
      ];

      const result = analyzeTrend(currentRepos, "typescript", "daily");

      expect(result.hasSufficientData).toBe(true);
      expect(result.persistentTrending.length).toBeGreaterThan(0);
      expect(
        result.persistentTrending.find((r) => r.repoName === "owner/persistent")
      ).toBeDefined();
      expect(result.newEntrants).toContain("owner/new-entrant");
      expect(result.droppedOff).toContain("owner/dropped");
    });

    it("should warn about data gaps", () => {
      const day1 = Date.now() - 6 * 24 * 60 * 60 * 1000; // 6 days ago (within 7 day retention)
      const day2 = Date.now() - 1000; // just now

      const cache = {
        entries: [
          {
            timestamp: day1,
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/repo1")],
          },
          {
            timestamp: day2,
            language: "typescript",
            range: "daily" as const,
            repos: [mockRepo("owner/repo2")],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockImplementation((p) => p === CACHE_FILE);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

      const result = analyzeTrend([mockRepo("owner/repo")], "typescript", "daily");

      expect(result.hasSufficientData).toBe(true);
      expect(result.analysisNote).toContain("gaps larger than 5 days");
    });
  });
});
