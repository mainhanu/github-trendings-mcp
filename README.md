# GitHub Trending MCP

[![NPM version](https://img.shields.io/npm/v/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)
[![NPM downloads](http://img.shields.io/npm/dm/github-trending-mcp.svg?style=flat)](https://npmjs.com/package/github-trending-mcp)

A Model Context Protocol (MCP) server that provides access to GitHub Trending repositories. It allows AI assistants to fetch and analyze trending repositories with language filters and time ranges.

## Features

- 🔥 **Fetch Trending Repositories** - Get the latest trending repos from GitHub
- 🌐 **Language Filter** - Filter by programming language (supports 600+ languages)
- 📅 **Time Range** - Query daily, weekly, or monthly trends
- 📊 **Detailed Data** - Returns stars, forks, contributors, and ai generated descriptions
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

## Configuration

### VS Code with Copilot

Add the following to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "github-trending": {
        "command": "npx",
        "args": ["github-trending-mcp"]
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
      "command": "npx",
      "args": ["github-trending-mcp"]
    }
  }
}
```

## Available Tools

### `github_trending`

Fetches GitHub trending repositories with optional filters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | No | Programming language to filter by. Supports full names and abbreviations. |
| `range` | string | No | Time range: `daily` (default), `weekly`, or `monthly` |

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
"Show me weekly trending Python projects"
"Get monthly trending repos for Rust"
```

## Available Resources

### `github-trending://languages`

Returns a list of all supported programming languages for filtering, including:
- Popular languages list
- Complete languages list (600+ languages)

## Available Prompts

### `analyze_github_trending`

A pre-built prompt for comprehensive analysis of trending repositories.

**Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `language` | string | Programming language to analyze |
| `range` | enum | Time range: `daily`, `weekly`, or `monthly` |

**Output includes:**
1. Overview table with rankings, stars, and descriptions
2. Detailed analysis of top 5 repositories
3. Trend summary with common themes and recommendations

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
- Stars added in the selected time range
- Programming language
- Top contributors

The data is parsed using Cheerio and returned in a structured JSON format that AI assistants can easily process and present.

## License

MIT
