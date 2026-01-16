import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { server } from "./server";
import { version } from "../package.json";

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`GitHub Trending MCP Server(${version}) running on stdio`);
}