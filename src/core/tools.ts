import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWalletTools } from './wallet-tools.js';
import { registerDeployTools } from './services/tools/deploy.js';
import { registerTransferTools } from './services/tools/transfer.js';
import { registerWriteTools } from './services/tools/write.js';
import { registerReadTools } from './services/tools/read.js';
import { registerVerifyTools } from './services/tools/verify.js';

/**
 * Register all EVM-related tools with the MCP server
 */
export function registerEVMTools(server: McpServer) {
  registerWalletTools(server);
  registerDeployTools(server);
  registerTransferTools(server);
  registerWriteTools(server);
  registerReadTools(server);
  registerVerifyTools(server);
}
