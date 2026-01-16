# GitHub Trending MCP

[![NPM version](https://img.shields.io/npm/v/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)
[![NPM downloads](http://img.shields.io/npm/dm/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)

A Model Context Protocol (MCP) server that provides access to GitHub Trending repositories. It allows AI assistants to fetch and analyze trending repositories with language filters.

## Features

- 🔥 **Fetch Trending Repositories** - Get the latest trending repos from GitHub
- 🌐 **Multi-Language Support** - Query multiple languages in one request for better efficiency (supports 600+ languages)
- ⚡ **Batch Fetching** - Fetch trends for multiple languages simultaneously, saving time and API calls
- 📊 **Detailed Data** - Returns stars, forks, contributors, and AI generated descriptions
- 📈 **Daily Tracking** - Use daily to track and analyze technology trends over time
- 📝 **Built-in Prompts** - Includes analysis prompts for comprehensive insights

## Installation

### Using npx (Recommended)

You can run the MCP server directly without installation:

```bash
npx github-trending-mcp
```

### Global Installation

```bash
npm install -g github-trending-mcp
```

Then run:

```bash
github-trending-mcp
```

### Update

To update to the latest version:

```bash
npm update -g github-trending-mcp
```

## Configuration

### VS Code with Copilot

Add the following to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "github-trending": {
        "command": "github-trending-mcp"
      }
    }
  }
}
```

### Claude Desktop

Add the following to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github-trending": {
      "command": "github-trending-mcp"
    }
  }
}
```

## Proxy Configuration
> ⚠️ **Troubleshooting:** If fetching repositories fails, please check that your `HTTPS_PROXY` or `HTTP_PROXY` environment variables are correctly set.

## Available Tools

### `github_trending`

Fetches GitHub trending repositories with optional filters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | No | Programming language(s) to filter by. Supports full names, abbreviations, and multiple languages (comma-separated). |

**Language Abbreviations:**

| Abbreviation | Language |
|--------------|----------|
| `ts` | TypeScript |
| `js` | JavaScript |
| `py` | Python |
| `rb` | Ruby |
| `go` | Go |
| `rs` | Rust |
| `cs` | C# |
| `cpp` | C++ |

**Example Usage:**

```
"What are the trending TypeScript repositories today?"
"Show me trending Python and Rust projects"
"Get trending repos for ts, py, go"
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
2. Detailed analysis of top 5 repositories
3. Trend summary with common themes and recommendations

### How to Use the Prompt

**In VS Code with Copilot:**
1. Open Copilot Chat
2. Type `/` to see available prompts
3. Select `analyze_github_trending`
4. Enter the language(s) you want to analyze

**In Claude Desktop:**
1. Click the prompt icon (📎) in the chat
2. Select `analyze_github_trending`
3. Fill in the language parameter

**Example Interactions:**

```
# Analyze single language
Use the analyze_github_trending prompt for TypeScript

# Analyze multiple languages
Use the analyze_github_trending prompt for "python, rust, go"

# Daily tracking
Run analyze_github_trending for JavaScript and compare with yesterday's trends
```

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
git clone https://github.com/user/github-trending-mcp.git
cd github-trending-mcp

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

# Run tests with coverage
npm run test:coverage
```

## How It Works

This MCP server scrapes the GitHub Trending page to extract repository information including:

- Repository name and description
- Star count and fork count
- Stars added today
- Programming language
- Top contributors

The data is parsed using Cheerio and returned in a structured JSON format that AI assistants can easily process and present.

**Multi-Language Efficiency:** When querying multiple languages, the server fetches data in parallel, significantly reducing response time compared to sequential requests.

## License

MIT
