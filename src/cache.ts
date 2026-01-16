import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

interface CacheEntry {
  timestamp: number; // Unix timestamp in ms
  language: string | null;
  range: "daily" | "weekly" | "monthly";
  repos: TrendingRepo[];
}

interface CacheData {
  entries: CacheEntry[];
}

// 缓存文件路径：~/.github-trending-mcp/cache.json
const CACHE_DIR = path.join(os.homedir(), ".github-trending-mcp");
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

// 缓存保留天数
const CACHE_RETENTION_DAYS = 7;
// 判断 repo 是否"已出现过"的天数阈值
const SEEN_THRESHOLD_DAYS = 3;

/**
 * 确保缓存目录存在
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 读取缓存数据
 */
function readCache(): CacheData {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(content) as CacheData;
    }
  } catch (error) {
    console.error("Failed to read cache:", error);
  }
  return { entries: [] };
}

/**
 * 写入缓存数据
 */
function writeCache(data: CacheData): void {
  ensureCacheDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 清理过期缓存条目
 */
function cleanExpiredEntries(data: CacheData): CacheData {
  const now = Date.now();
  const retentionMs = CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return {
    entries: data.entries.filter((entry) => now - entry.timestamp < retentionMs),
  };
}

/**
 * 判断两个 repo 列表是否相同（基于 full_name）
 */
function isSameRepoList(a: TrendingRepo[], b: TrendingRepo[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map((r) => r.full_name));
  const setB = new Set(b.map((r) => r.full_name));
  if (setA.size !== setB.size) return false;
  for (const name of setA) {
    if (!setB.has(name)) return false;
  }
  return true;
}

/**
 * 保存 trending 结果到缓存
 * - 如果相同 language + range 的最新缓存与当前结果一致，覆盖（更新时间戳）
 * - 否则新增一条缓存记录
 */
export function saveTrendingToCache(
  repos: TrendingRepo[],
  language: string | null,
  range: "daily" | "weekly" | "monthly"
): void {
  let data = readCache();
  data = cleanExpiredEntries(data);

  // 查找相同 language + range 的最新缓存
  const matchingEntries = data.entries
    .filter((e) => e.language === language && e.range === range)
    .sort((a, b) => b.timestamp - a.timestamp);

  const latestEntry = matchingEntries[0];

  if (latestEntry && isSameRepoList(latestEntry.repos, repos)) {
    // repo 列表相同，只更新数据（如 star 数），不更新时间戳
    // 保持原始时间戳，这样 findSeenRepos 能正确识别为"已见过"
    latestEntry.repos = repos;
  } else {
    // 新增缓存条目
    data.entries.push({
      timestamp: Date.now(),
      language,
      range,
      repos,
    });
  }

  writeCache(data);
}

/**
 * 获取指定 language + range 的历史缓存记录
 * @param language 编程语言
 * @param range 时间范围
 * @param withinDays 获取多少天内的记录
 */
export function getHistoricalCache(
  language: string | null,
  range: "daily" | "weekly" | "monthly",
  withinDays: number = CACHE_RETENTION_DAYS
): CacheEntry[] {
  const data = readCache();
  const now = Date.now();
  const thresholdMs = withinDays * 24 * 60 * 60 * 1000;

  return data.entries
    .filter(
      (e) =>
        e.language === language &&
        e.range === range &&
        now - e.timestamp < thresholdMs
    )
    .sort((a, b) => b.timestamp - a.timestamp); // 最新的在前
}

/**
 * 找出 3 天内已出现过的 repo（不需要再分析）
 */
export function findSeenRepos(
  currentRepos: TrendingRepo[],
  language: string | null,
  range: "daily" | "weekly" | "monthly"
): Set<string> {
  const historicalEntries = getHistoricalCache(language, range, SEEN_THRESHOLD_DAYS);
  const seenRepoNames = new Set<string>();

  // 排除当前这次的时间戳（如果刚缓存过）
  const now = Date.now();
  const recentThreshold = 60 * 1000; // 1分钟内视为"当前这次"

  for (const entry of historicalEntries) {
    // 跳过非常近的条目（可能是当前这次刚写入的）
    if (now - entry.timestamp < recentThreshold) {
      continue;
    }
    for (const repo of entry.repos) {
      seenRepoNames.add(repo.full_name);
    }
  }

  return seenRepoNames;
}

export interface TrendAnalysisData {
  /** 是否有足够的数据进行趋势分析 */
  hasSufficientData: boolean;
  /** 分析说明 */
  analysisNote: string;
  /** 历史数据点 */
  dataPoints: Array<{
    date: string;
    timestamp: number;
    repoCount: number;
    repos: string[];
  }>;
  /** 持续 trending 的 repo（出现在多个数据点中） */
  persistentTrending: Array<{
    repoName: string;
    appearances: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  /** 新晋 trending 的 repo（首次出现） */
  newEntrants: string[];
  /** 从 trending 消失的 repo */
  droppedOff: string[];
}

/**
 * 分析趋势数据
 * 根据历史缓存分析 trending 趋势
 */
export function analyzeTrend(
  currentRepos: TrendingRepo[],
  language: string | null,
  range: "daily" | "weekly" | "monthly"
): TrendAnalysisData {
  const historicalEntries = getHistoricalCache(language, range, CACHE_RETENTION_DAYS);

  // 格式化时间戳为日期字符串
  const formatDate = (ts: number) => new Date(ts).toISOString().split("T")[0];
  const formatDateTime = (ts: number) =>
    new Date(ts).toISOString().replace("T", " ").slice(0, 19);

  // 构建数据点
  const dataPoints = historicalEntries.map((entry) => ({
    date: formatDate(entry.timestamp),
    timestamp: entry.timestamp,
    repoCount: entry.repos.length,
    repos: entry.repos.map((r) => r.full_name),
  }));

  // 判断数据是否足够
  // 需要至少 2 个不同日期的数据点，且时间跨度不能太长（超过 5 天的间隔视为数据不连续）
  const uniqueDates = new Set(dataPoints.map((dp) => dp.date));
  const hasSufficientData = uniqueDates.size >= 2;

  let analysisNote = "";
  if (dataPoints.length === 0) {
    analysisNote = "No historical data available. This is the first fetch.";
  } else if (uniqueDates.size < 2) {
    analysisNote = `Only ${uniqueDates.size} day(s) of data available. Need at least 2 different days for trend analysis.`;
  } else {
    // 检查数据连续性
    const sortedTimestamps = [...dataPoints.map((dp) => dp.timestamp)].sort(
      (a, b) => a - b
    );
    let maxGapDays = 0;
    for (let i = 1; i < sortedTimestamps.length; i++) {
      const gapDays =
        (sortedTimestamps[i] - sortedTimestamps[i - 1]) / (24 * 60 * 60 * 1000);
      maxGapDays = Math.max(maxGapDays, gapDays);
    }

    if (maxGapDays > 5) {
      analysisNote = `Data has gaps larger than 5 days (max gap: ${maxGapDays.toFixed(1)} days). Trend analysis may be less accurate.`;
    } else {
      const totalDays =
        (sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0]) /
        (24 * 60 * 60 * 1000);
      analysisNote = `Trend analysis based on ${uniqueDates.size} days of data over ${totalDays.toFixed(1)} day span.`;
    }
  }

  // 统计每个 repo 出现次数
  const repoAppearances = new Map<
    string,
    { count: number; firstSeen: number; lastSeen: number }
  >();

  for (const entry of historicalEntries) {
    for (const repo of entry.repos) {
      const existing = repoAppearances.get(repo.full_name);
      if (existing) {
        existing.count++;
        existing.firstSeen = Math.min(existing.firstSeen, entry.timestamp);
        existing.lastSeen = Math.max(existing.lastSeen, entry.timestamp);
      } else {
        repoAppearances.set(repo.full_name, {
          count: 1,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
        });
      }
    }
  }

  // 找出持续 trending 的 repo（出现 2 次及以上）
  const persistentTrending: TrendAnalysisData["persistentTrending"] = [];
  for (const [repoName, data] of repoAppearances) {
    if (data.count >= 2) {
      persistentTrending.push({
        repoName,
        appearances: data.count,
        firstSeen: formatDateTime(data.firstSeen),
        lastSeen: formatDateTime(data.lastSeen),
      });
    }
  }
  persistentTrending.sort((a, b) => b.appearances - a.appearances);

  // 找出新晋 trending（当前列表中但历史缓存中没有的）
  const historicalRepoNames = new Set(repoAppearances.keys());
  const currentRepoNames = new Set(currentRepos.map((r) => r.full_name));
  const newEntrants = [...currentRepoNames].filter(
    (name) => !historicalRepoNames.has(name)
  );

  // 找出从 trending 消失的 repo（历史最新一条有，但当前没有的）
  const droppedOff: string[] = [];
  if (dataPoints.length > 0) {
    const latestHistorical = dataPoints[0]; // 已经按时间倒序排列
    for (const repoName of latestHistorical.repos) {
      if (!currentRepoNames.has(repoName)) {
        droppedOff.push(repoName);
      }
    }
  }

  return {
    hasSufficientData,
    analysisNote,
    dataPoints: dataPoints.slice(0, 10), // 最多返回 10 个数据点
    persistentTrending: persistentTrending.slice(0, 20), // 最多返回 20 个
    newEntrants,
    droppedOff,
  };
}

/**
 * 分离新 repo 和已见过的 repo
 */
export function separateNewAndSeenRepos(
  currentRepos: TrendingRepo[],
  language: string | null,
  range: "daily" | "weekly" | "monthly"
): {
  newRepos: TrendingRepo[];
  seenRepos: TrendingRepo[];
  seenRepoNames: Set<string>;
} {
  const seenRepoNames = findSeenRepos(currentRepos, language, range);

  const newRepos: TrendingRepo[] = [];
  const seenRepos: TrendingRepo[] = [];

  for (const repo of currentRepos) {
    if (seenRepoNames.has(repo.full_name)) {
      seenRepos.push(repo);
    } else {
      newRepos.push(repo);
    }
  }

  return { newRepos, seenRepos, seenRepoNames };
}
