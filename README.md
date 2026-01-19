# GitHub Trending MCP

[![NPM version](https://img.shields.io/npm/v/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)
[![NPM downloads](http://img.shields.io/npm/dm/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)
[![GitHub](https://img.shields.io/github/stars/mainhanu/github-trendings-mcp?style=flat)](https://github.com/mainhanu/github-trendings-mcp)

A Model Context Protocol (MCP) server that provides access to GitHub Trending repositories. It allows AI assistants to fetch and analyze trending repositories with language filters.

## Features

- 🔥 **Fetch Trending Repositories** - Get the latest trending repos from GitHub
- 📝 **Built-in Prompts** - Includes analysis prompts for comprehensive insights
- 🌐 **Multi-Language Support** - Query multiple languages in one request for better efficiency (supports 600+ languages)
- 📊 **Detailed Data** - Returns stars, forks, contributors, and AI generated descriptions
- 📈 **Daily Tracking** - Use daily to track and analyze technology trends over time

## Installation


```bash
npm install -g github-trending-mcp
```

### Update

To update to the latest version:

```bash
npm update -g github-trending-mcp
```

## Configuration

### VS Code with Copilot
1. run command: `MCP: Add Serve`
2. type: select `stdio`
3. command: input `github-trending-mcp`
4. server id: `github-trending`

## Proxy Configuration
> ⚠️ **Troubleshooting:** If fetching repositories fails and you are using network proxy.

1. option 1: please check that your `HTTPS_PROXY` or `HTTP_PROXY` environment variables are correctly set.
2. option 2: add `--proxy` after command in mcp server config, like
```
"args": [
  "--proxy=http://127.0.0.1:7890"
]
```


## Available Resources

### `github-trending://languages`

Returns a list of all supported programming languages for filtering, including:
- Popular languages list
- Complete languages list (600+ languages)

## Available Prompts (⭐ Recommended)

> **💎 Core Value:** The built-in MCP prompts are the most valuable feature of this plugin. They provide structured, comprehensive analysis that goes far beyond simple data fetching.

### `analyze_github_trending`

A pre-built prompt for comprehensive analysis of trending repositories. This prompt orchestrates the entire workflow - fetching data, analyzing patterns, and generating actionable insights.

**Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `language` | string | Programming language(s) to analyze (supports multiple languages) |

**Output includes:**
1. Overview table with rankings, stars, and descriptions
2. Detailed analysis of top 10 repositories.(you can change the generated prompt)
3. Trend summary with common themes and recommendations

### `analyze_repository`

A comprehensive prompt for deep-diving into a specific GitHub repository. Perfect for understanding a project before adopting it or contributing to it.

**Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `repository` | string | Repository to analyze (e.g., `facebook/react` or full URL) |

**Analysis includes:**
1. 📦 **Overview** - Stars, forks, language, license, activity
2. 🔍 **Core Purpose** - What it does and who it's for
3. ✨ **Key Features** - Main capabilities and functionalities
4. 💼 **Real-World Use Cases** - Concrete business scenarios
5. 🏗️ **Architecture** - Tech stack, components, design patterns
6. 📊 **Community & Adoption** - User base, activity level, notable users
7. 🗣️ **User Feedback** - Common issues, feature requests, sentiment
8. 💪 **Strengths & Considerations** - Pros and things to be aware of
9. 🚀 **Getting Started** - Quick start guide

### How to Use the Prompt

**In VS Code with Copilot:**
1. Open Copilot Chat
2. Type `/` to see available prompts
3. Select `analyze_github_trending`
4. Enter the language(s) you want to analyze

### 📈 Daily Tracking Strategy

**Why use daily?**
- 🔍 **Spot emerging technologies** - New frameworks often appear in trending before going mainstream
- 📊 **Track project momentum** - See which projects are gaining or losing traction
- 🎯 **Identify patterns** - Discover common themes across different languages
- 💡 **Learning opportunities** - Find high-quality codebases to study

**Recommended workflow:**
1. Run the prompt every morning for your primary languages
2. Note any new entries or significant star increases
3. Over time, you'll develop intuition for technology trends

> **💡 Pro Tip:** Combine multiple languages (e.g., "ts, py, rs") in one analysis to compare trends across ecosystems and identify cross-language patterns.

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/mainhanu/github-trendings-mcp.git
cd github-trendings-mcp

# Install dependencies
npm install
```

### Scripts

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## How It Works

This MCP server scrapes the GitHub Trending page to extract repository information including:

- Repository name and description
- Star count and fork count
- Stars added today
- Programming language
- Top contributors

The data is parsed using Cheerio and returned in a structured JSON format that AI assistants can easily process and present.

## License

MIT
