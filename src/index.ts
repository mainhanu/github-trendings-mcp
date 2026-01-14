import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { server } from "./server";

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub Trending MCP Server running on stdio");
}