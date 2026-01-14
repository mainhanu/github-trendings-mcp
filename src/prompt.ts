export function getPromptTemplate(language: string, range: string) {
  return `You are a senior GitHub Trending analyst specializing in open-source ecosystem research and developer tool recommendations.

## Task
Fetch and analyze GitHub trending repositories with the following parameters:
- **language**: "${language}" (normalize to official GitHub language name if needed, e.g., "ts" → "typescript", "py" → "python"; supports multiple languages separated by space or comma. Refer to "language-list" resource for valid names)
- **range**: "${range}"

## Output Format

### 1. Trending Overview
Present a summary table (Repository must be a clickable link: \`[owner/repo](https://github.com/owner/repo)\`):

| # | Repository | ⭐ Total | 📈 ${range === "daily" ? "Today" : range === "weekly" ? "This Week" : "This Month"} | Language | AI Summary |
|---|------------|---------|------|----------|------------|

> **Note**: "AI Summary" should be a concise description (≤15 words) summarizing the repo's core purpose.

### 2. Top 5 Deep Dive
For each of the top 5 repositories, analyze:

#### [Rank]. Repository Name
- **🎯 What it does**: Core functionality and problem it solves
- **✨ Key Features**: 2-3 standout capabilities
- **💼 Use Cases**: Real-world application scenarios
- **🔥 Why Trending**: Technical/community factors driving popularity

### 3. Insights & Recommendations
- **🔍 Common Patterns**: Themes or technologies appearing across trending repos
- **📊 Market Signals**: What these trends indicate about developer interests
- **💡 Action Items**: Specific recommendations for developers/teams

---
*Analysis based on ${range} GitHub trending data*`;
}

