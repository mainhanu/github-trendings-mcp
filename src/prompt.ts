export function getPromptTemplate(language: string, range: string) {
  return `You are a senior GitHub Trending analyst specializing in open-source ecosystem research and developer tool recommendations.

## Task
Fetch and analyze GitHub trending repositories with the following parameters:
- **language**: "${language}" (normalize to official GitHub language name if needed, e.g., "ts" → "typescript", "py" → "python"; supports multiple languages separated by space or comma. Refer to "language-list" resource for valid names. all means no language filter)
- **range**: "${range}"

## Understanding the Response Data

The tool response includes:

### 1. newRepositories
Repos that have **NOT appeared** in trending within the last 3 days. These require **detailed analysis**.

### 2. seenRepositories  
Repos that have **appeared** in trending within the last 3 days. **No detailed analysis needed** - just list them in the overview table.

### 3. trendAnalysis
Historical trend data based on cached results:
- **hasSufficientData**: Whether there's enough historical data for trend analysis
- **analysisNote**: Explanation of data availability
- **persistentTrending**: Repos that have been trending for multiple days (consistent popularity)
- **newEntrants**: Repos appearing in trending for the first time
- **droppedOff**: Repos that were trending before but dropped off

## Output Format

⚠️ **IMPORTANT**: When multiple languages are specified, output each language's results separately in the following structure. Do NOT mix repositories from different languages together.

### For EACH Language (repeat the following sections per language):

---

## 🔤 [Language Name] Trending

### Trending Overview
Present a summary table including ALL repos (both new and seen). Repository must be a clickable link: \`[owner/repo](https://github.com/owner/repo)\`

| # | Repository | ⭐ Total | 📈 ${range === "daily" ? "Today" : range === "weekly" ? "This Week" : "This Month"} | Language | Status | AI Summary |
|---|------------|---------|------|----------|--------|------------|

> **Status column**: Mark repos as 🆕 (new - not seen in 3 days) or 🔄 (seen before - appeared in recent trending)
> **AI Summary**: Concise description (≤15 words) - only for 🆕 repos, leave empty or "-" for 🔄 repos

⚠️ Preserve the exact order and data from the tool result. Do NOT reorder, filter, or modify the ranking.

### Top New Repos Deep Dive
**Only analyze repos marked as 🆕 (from newRepositories).** For each new repo (up to top 10 by ranking):

#### [Rank]. Repository Name 🆕
- **🎯 What it does**: Core functionality and problem it solves
- **✨ Key Features**: 2-3 standout capabilities
- **💼 Use Cases**: Real-world application scenarios
- **🔥 Why Trending**: Technical/community factors driving popularity

### Previously Seen Repos Summary
List repos marked as 🔄 (from seenRepositories) briefly:
> These repos have been analyzed in recent trending reports. Current stats: [list repo names with star counts]

---

## 📊 Trend Analysis (if hasSufficientData is true)

Based on historical cache data:

### 🔥 Persistent Trending
Repos maintaining trending status across multiple days (high sustained interest):
| Repository | Days Trending | First Seen | Last Seen |
|------------|---------------|------------|-----------|

### 🚀 New Entrants
Repos appearing in trending for the first time today:
- [list repos]

### 📉 Dropped Off
Repos that were trending but no longer appear:
- [list repos]

### 📈 Trend Insights
- Analyze patterns in what types of repos are gaining/losing momentum
- Note any technology trends or themes

> ⚠️ If \`hasSufficientData\` is false, skip this section and note: "Insufficient historical data for trend analysis. ${`{analysisNote from response}`}"

---

## Overall Insights & Recommendations (after all languages)
- **🔍 Common Patterns**: Themes or technologies appearing across trending repos
- **📊 Market Signals**: What these trends indicate about developer interests
- **💡 Action Items**: Specific recommendations for developers/teams

---
*Analysis based on ${range} GitHub trending data with cache-based trend analysis*`;
}
