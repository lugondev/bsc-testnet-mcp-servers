import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "../index.js";
import { type Address } from 'viem';

export function registerDeployTools(server: McpServer) {
	// Deploy standard ERC20 token
	server.tool(
		"deploy_standard_token",
		"Deploy a new standard ERC20 token contract",
		{
			walletName: z.string().describe("The name of the stored wallet to use for deployment"),
			name: z.string().describe("Token name (e.g., 'My Token')"),
			symbol: z.string().describe("Token symbol/ticker (e.g., 'MTK')"),
			decimals: z.number().optional().describe("Number of decimals for the token (default: 18)"),
			totalSupply: z.number().optional().describe("Total supply of tokens to mint (default: 100,000,000)"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, name, symbol, decimals = 18, totalSupply = 100000000, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const result = await services.deployERC20TokenStandard(
					walletName,
					name,
					symbol,
					decimals,
					totalSupply,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: result.txHash,
							contractAddress: result.contractAddress,
							name,
							symbol,
							decimals,
							totalSupply,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error deploying standard token: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Deploy tax token
	server.tool(
		"deploy_tax_token",
		"Deploy a new ERC20 token with tax functionality on buy/sell transactions",
		{
			walletName: z.string().describe("The name of the stored wallet to use for deployment"),
			name: z.string().describe("Token name (e.g., 'My Token')"),
			symbol: z.string().describe("Token symbol/ticker (e.g., 'MTK')"),
			dexRouter: z.string().describe(`DEX router contract address for liquidity pair creation.
Uniswap: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
Pancake: 0x10ED43C718714eb63d5aA57B78B54704E256024E
user must pick one router for action`),
			developmentFund: z.string().optional().describe("Address that receives collected transaction fees (defaults to zero address)"),
			percentageBuyFee: z.number().optional().describe("Fee percentage charged on buy transactions (e.g., 5 for 5%, default: 3). Confirm before deploy"),
			percentageSellFee: z.number().optional().describe("Fee percentage charged on sell transactions (e.g., 5 for 5%, default: 3). Confirm before deploy"),
			totalSupply: z.number().optional().describe("Total supply of tokens to mint (default: 100,000,000)"),
			network: z.string().optional().describe("Network name or chain ID. Supports all EVM-compatible networks. Defaults to 'bsc'.")
		},
		async ({ walletName, name, symbol, dexRouter, developmentFund, percentageBuyFee = 0, percentageSellFee = 0, totalSupply = 100000000, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const result = await services.deployERC20TokenTax(
					name,
					symbol,
					dexRouter as Address,
					walletName,
					developmentFund as Address,
					percentageBuyFee,
					percentageSellFee,
					totalSupply,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: result.txHash,
							contractAddress: result.contractAddress,
							name,
							symbol,
							dexRouter,
							developmentFund,
							buyFeePercentage: percentageBuyFee,
							sellFeePercentage: percentageSellFee,
							totalSupply,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error deploying tax token: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	server.tool(
		"enable_trading",
		"Enable trading for a tax token contract with specified parameters",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			contractAddress: z.string().describe("The address of the tax token contract"),
			maxHolder: z.string().describe("Maximum amount of tokens a wallet can hold (in token units)"),
			maxBuy: z.string().describe("Maximum amount of tokens that can be bought in a single transaction (in token units)"),
			swapAtAmount: z.string().describe("Amount of tokens that triggers a swap (in token units)"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', etc.) or chain ID. Defaults to BSC.")
		},
		async ({ walletName, contractAddress, maxHolder, maxBuy, swapAtAmount, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const txHash = await services.enableTrading(
					contractAddress,
					maxHolder,
					maxBuy,
					swapAtAmount,
					walletName,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: txHash,
							contractAddress,
							maxHolder,
							maxBuy,
							swapAtAmount,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error enabling trading: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	server.tool(
		"set_swap_and_liquify_enabled",
		"Enable or disable swap and liquify functionality for a tax token",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			contractAddress: z.string().describe("The address of the tax token contract"),
			enabled: z.boolean().describe("Whether to enable (true) or disable (false) swap and liquify"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', etc.) or chain ID. Defaults to BSC.")
		},
		async ({ walletName, contractAddress, enabled, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const txHash = await services.setSwapAndLiquifyEnabled(
					contractAddress,
					enabled,
					walletName,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: txHash,
							contractAddress,
							enabled,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error setting swap and liquify state: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);
}
