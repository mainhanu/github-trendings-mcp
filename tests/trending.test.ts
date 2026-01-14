import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTrendingRepos } from "../src/trending";

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
        <span data-view-component="true">
          <span class="d-inline-block" href="/user1">
            <img src="https://avatars.githubusercontent.com/u/1?s=40" />
          </span>
        </span>
      </div>
    </article>
    <article class="Box-row">
      <h2><a href="/microsoft/typescript">microsoft / typescript</a></h2>
      <p>TypeScript is a superset of JavaScript that compiles to clean JavaScript output.</p>
      <div class="f6">
        <span itemprop="programmingLanguage">TypeScript</span>
        <a data-view-component="true" href="/microsoft/typescript/stargazers">102,000</a>
        <a data-view-component="true" href="/microsoft/typescript/forks">12,300</a>
        <span class="float-sm-right">567 stars today</span>
      </div>
    </article>
    <article class="Box-row">
      <h2><a href="/torvalds/linux">torvalds / linux</a></h2>
      <div class="f6">
        <span itemprop="programmingLanguage">C</span>
        <a data-view-component="true" href="/torvalds/linux/stargazers">185,000</a>
        <a data-view-component="true" href="/torvalds/linux/forks">55,000</a>
        <span class="float-sm-right">890 stars today</span>
      </div>
    </article>
  </div>
</body>
</html>
`;

const MOCK_EMPTY_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div></div>
</body>
</html>
`;

describe("getTrendingRepos", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch(html: string) {
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(html),
    });
  }

  it("should parse trending repositories correctly", async () => {
    mockFetch(MOCK_TRENDING_HTML);

    const repos = await getTrendingRepos();

    expect(repos).toHaveLength(3);

    expect(repos[0]).toMatchObject({
      full_name: "facebook/react",
      description:
        "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      language: "JavaScript",
      stargazers_count: 228000,
      forks_count: 46500,
      stargazers_add: 1234,
    });

    expect(repos[1]).toMatchObject({
      full_name: "microsoft/typescript",
      language: "TypeScript",
      stargazers_count: 102000,
      forks_count: 12300,
    });

    expect(repos[2]).toMatchObject({
      full_name: "torvalds/linux",
      language: "C",
      description: "",
    });
  });

  it("should return empty array for empty page", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    const repos = await getTrendingRepos();

    expect(repos).toEqual([]);
  });

  it("should build correct URL with default params", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/?since=daily",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.any(String),
        }),
      })
    );
  });

  it("should build correct URL with language param", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos({ lang: "python" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/python?since=daily",
      expect.any(Object)
    );
  });

  it("should build correct URL with range param", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos({ range: "weekly" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/?since=weekly",
      expect.any(Object)
    );
  });

  it("should build correct URL with spoken_language_code param", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos({ spoken_language_code: "zh" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/?since=daily&spoken_language_code=zh",
      expect.any(Object)
    );
  });

  it("should build correct URL with all params", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos({
      lang: "javascript",
      range: "monthly",
      spoken_language_code: "en",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/javascript?since=monthly&spoken_language_code=en",
      expect.any(Object)
    );
  });

  it("should handle null language param", async () => {
    mockFetch(MOCK_EMPTY_HTML);

    await getTrendingRepos({ lang: null });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/trending/?since=daily",
      expect.any(Object)
    );
  });

  it("should parse users from trending repos", async () => {
    mockFetch(MOCK_TRENDING_HTML);

    const repos = await getTrendingRepos();

    expect(repos[0].users).toBeDefined();
    expect(Array.isArray(repos[0].users)).toBe(true);
  });

  it("should handle repos without description", async () => {
    mockFetch(MOCK_TRENDING_HTML);

    const repos = await getTrendingRepos();
    const linuxRepo = repos.find((r) => r.full_name === "torvalds/linux");

    expect(linuxRepo?.description).toBe("");
  });

  it("should parse numbers with commas correctly", async () => {
    mockFetch(MOCK_TRENDING_HTML);

    const repos = await getTrendingRepos();

    expect(repos[0].stargazers_count).toBe(228000);
    expect(repos[0].forks_count).toBe(46500);
  });
});
