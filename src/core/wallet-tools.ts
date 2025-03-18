import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as walletTools from './wallet/index.js';

function registerToolWithZod(
	server: McpServer,
	{
		name,
		description,
		schema,
		execute
	}: {
		name: string;
		description: string;
		schema: z.ZodObject<any>;
		execute: (params: any) => Promise<any>;
	}
): void {
	server.tool(name, description, schema.shape, execute);
}

/**
 * Register all wallet-related tools with the MCP server
 * @param server The MCP server instance
 */
export function registerWalletTools(server: McpServer): void {
	// Define schemas for each tool using Zod
	const transferSchema = z.object({
		walletName: z.string(),
		toAddress: z.string(),
		amount: z.string(),
		network: z.string().optional()
	});

	const tokenTransferSchema = transferSchema.extend({
		tokenAddress: z.string()
	});

	const swapSchema = z.object({
		walletName: z.string(),
		slippagePercent: z.string(),
		network: z.string().optional()
	});

	const buySchema = swapSchema.extend({
		amountWantToBuy: z.string()
	});

	const sellSchema = swapSchema.extend({
		amountToSell: z.string()
	});

	// Register transfer tools
	registerToolWithZod(server, {
		name: "transfer_eth_from_wallet",
		description: "Transfer ETH from a stored wallet to another address",
		schema: transferSchema,
		execute: walletTools.transferEthFromWallet.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "transfer_token_from_wallet",
		description: "Transfer ERC20 tokens from a stored wallet to another address",
		schema: tokenTransferSchema,
		execute: walletTools.transferTokenFromWallet.execute as (params: any) => Promise<any>
	});

	// Register swap tools
	registerToolWithZod(server, {
		name: "buy_usdt_from_wallet",
		description: "Buy USDT using PancakeSwap's Router",
		schema: buySchema,
		execute: walletTools.buyUsdtFromWallet.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "sell_usdt_from_wallet",
		description: "Sell USDT for ETH using PancakeSwap's Router",
		schema: sellSchema,
		execute: walletTools.sellUsdtFromWallet.execute as (params: any) => Promise<any>
	});

	// Register wallet management tools
	registerToolWithZod(server, {
		name: "create_wallet",
		description: "Create a new EVM wallet and store it securely",
		schema: z.object({ name: z.string() }),
		execute: walletTools.createWallet.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "import_private_key",
		description: "Import an existing private key and store it as a wallet",
		schema: z.object({
			name: z.string(),
			privateKey: z.string()
		}),
		execute: walletTools.importWallet.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "get_stored_wallet",
		description: "Get information about a stored wallet",
		schema: z.object({
			identifier: z.string(),
			lookupBy: z.enum(['name', 'address'])
		}),
		execute: walletTools.getStoredWallet.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "list_wallets",
		description: "List all stored wallets",
		schema: z.object({}),
		execute: walletTools.listWallets.execute as (params: any) => Promise<any>
	});

	registerToolWithZod(server, {
		name: "get_address_from_private_key",
		description: "Get the EVM address derived from a private key",
		schema: z.object({
			privateKey: z.string()
		}),
		execute: walletTools.getAddressFromPrivateKey.execute as (params: any) => Promise<any>
	});
}
