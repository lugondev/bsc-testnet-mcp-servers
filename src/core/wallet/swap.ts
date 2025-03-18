import { type Tool, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as services from "../services/index.js";

type BuyUsdtParams = {
	walletName: string;
	amountWantToBuy: string;
	slippagePercent: string;
	network?: string;
};

type SellUsdtParams = {
	walletName: string;
	amountToSell: string;
	slippagePercent: string;
	network?: string;
};

export const buyUsdtFromWallet: Tool = {
	name: "buy_usdt_from_wallet",
	description: "Buy USDT using PancakeSwap's Router",
	inputSchema: {
		type: "object",
		properties: {
			walletName: { type: "string", description: "Name of the stored wallet to execute swap from" },
			amountWantToBuy: { type: "string", description: "Amount of USDT to buy" },
			slippagePercent: { type: "string", description: "Maximum slippage percentage (e.g., 0.5 for 0.5%)" },
			network: { type: "string", description: "Network name (default: bsc-testnet)" }
		},
		required: ["walletName", "amountWantToBuy", "slippagePercent"]
	},
	async execute({ walletName, amountWantToBuy, slippagePercent, network = 'bsc-testnet' }: BuyUsdtParams): Promise<CallToolResult> {
		try {
			const wallet = await services.walletService.getWalletByName(walletName);
			const txHash = await services.routerService.executeBuyUSDT(
				wallet.privateKey,
				amountWantToBuy,
				parseFloat(slippagePercent),
				network
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						transactionHash: txHash,
						wallet: wallet.address,
						slippagePercent,
						amountWantToBuy,
						network
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error executing swap: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const sellUsdtFromWallet: Tool = {
	name: "sell_usdt_from_wallet",
	description: "Sell USDT for ETH using PancakeSwap's Router",
	inputSchema: {
		type: "object",
		properties: {
			walletName: { type: "string", description: "Name of the stored wallet to execute swap from" },
			amountToSell: { type: "string", description: "Amount of USDT to sell" },
			slippagePercent: { type: "string", description: "Maximum slippage percentage (e.g., 0.5 for 0.5%)" },
			network: { type: "string", description: "Network name (default: bsc-testnet)" }
		},
		required: ["walletName", "amountToSell", "slippagePercent"]
	},
	async execute({ walletName, amountToSell, slippagePercent, network = 'bsc-testnet' }: SellUsdtParams): Promise<CallToolResult> {
		try {
			const wallet = await services.walletService.getWalletByName(walletName);
			const txHash = await services.routerService.executeSellUSDT(
				wallet.privateKey,
				amountToSell,
				parseFloat(slippagePercent),
				network
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						transactionHash: txHash,
						wallet: wallet.address,
						slippagePercent,
						amountToSell,
						network
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error executing swap: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};
