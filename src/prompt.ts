export function getPromptTemplate(language: string, range: string) {
  return `You are a GitHub Trending analyst. Please analyze trending repositories using the github_trending tool.

## Task
Call the github_trending tool with:
- language: ${language}
- range: ${range}

## Output Requirements
After fetching the data, provide a comprehensive analysis:

### 1. Overview Table
Create a markdown table with columns:
| Rank | Repository | Stars | Today's Stars | Language | Description |

### 2. Detailed Analysis
For each of the top 5 repositories, provide:
- **Project Introduction**: What the project does and its main features
- **Use Cases**: Practical business/development scenarios
- **Key Insights**: Why it's trending, notable technical highlights

### 3. Trend Summary
- Common themes across trending repos
- Emerging technologies or patterns
- Recommendations for developers

Please present the analysis in a clear, well-structured format.`;
}
