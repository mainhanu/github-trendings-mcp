import * as cheerio from "cheerio";
import { ProxyAgent } from "undici";

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY || 
    // get from command arguments
    (() => {
      const arg = process.argv.find((a) =>
        a.startsWith("--proxy=")
      );
      if (arg) {
        return arg.split("=")[1];
      }
      return undefined;
    })();

  if (proxyUrl) {
    console.error(`Using proxy: ${proxyUrl}`);
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

interface TrendingUser {
  avatar: string;
  href: string;
}

interface TrendingRepo {
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  stargazers_add: number;
  users: TrendingUser[];
}

interface FetchTrendingParams {
  lang?: string | null;
  range?: "daily" | "weekly" | "monthly";
  spoken_language_code?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

export async function getTrendingRepos(
  params: FetchTrendingParams = {}
): Promise<TrendingRepo[]> {
  const html = await fetchPage(params);
  return parsePage(html);
}

function buildTrendingUrl({
  lang,
  range = "daily",
  spoken_language_code,
}: FetchTrendingParams): string {
  const baseUrl = `https://github.com/trending/${lang ?? ""}`;
  const params = new URLSearchParams({ since: range });

  if (spoken_language_code) {
    params.set("spoken_language_code", spoken_language_code);
  }

  return `${baseUrl}?${params.toString()}`;
}

async function fetchPage(params: FetchTrendingParams): Promise<string> {
  const dispatcher = getProxyAgent();
  const response = await fetch(buildTrendingUrl(params), {
    headers: { "User-Agent": USER_AGENT },
    ...(dispatcher && { dispatcher }),
  });
  return response.text();
}

function parseNumber(text: string | undefined): number {
  if (!text) return 0;
  return parseInt(text.replace(/,/g, "").trim(), 10) || 0;
}

function parseUsers(
  $: ReturnType<typeof cheerio.load>,
  $article: ReturnType<ReturnType<typeof cheerio.load>>
): TrendingUser[] {
  const users: TrendingUser[] = [];

  $article
    .find("span[data-view-component='true'] .d-inline-block")
    .each((_, el) => {
      const $el = $(el);
      const avatar = $el.find("img").attr("src");
      const href = $el.attr("href");

      if (avatar && href) {
        users.push({ avatar, href });
      }
    });

  return users;
}

function parseArticle(
  $: ReturnType<typeof cheerio.load>,
  article: Parameters<ReturnType<typeof cheerio.load>>[0]
): TrendingRepo | null {
  try {
    const $article = $(article);
    const $footer = $article.find(".f6");
    const $links = $footer.find('a[data-view-component="true"]');

    const fullName = $article.find("h2 > a").attr("href")?.slice(1);
    if (!fullName) return null;

    return {
      full_name: fullName,
      description: $article.find("p").text().trim(),
      language:
        $footer.find('span[itemprop="programmingLanguage"]').text().trim() ||
        "",
      stargazers_count: parseNumber($links.eq(0).text()),
      forks_count: parseNumber($links.eq(1).text()),
      stargazers_add: parseNumber($footer.find(".float-sm-right").text()),
      users: parseUsers($, $article),
    };
  } catch {
    return null;
  }
}

function parsePage(html: string): TrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $("div > article.Box-row").each((_, article) => {
    const repo = parseArticle($, article);
    if (repo) {
      repos.push(repo);
    }
  });

  return repos;
}
