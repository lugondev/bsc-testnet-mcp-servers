import { type Tool, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as services from "../services/index.js";

type TransferEthParams = {
	walletName: string;
	toAddress: string;
	amount: string;
	network?: string;
};

type TransferTokenParams = {
	walletName: string;
	tokenAddress: string;
	toAddress: string;
	amount: string;
	network?: string;
};

export const transferEthFromWallet: Tool = {
	name: "transfer_eth_from_wallet",
	description: "Transfer ETH from a stored wallet to another address",
	inputSchema: {
		type: "object",
		properties: {
			walletName: { type: "string", description: "Name of the stored wallet to send from" },
			toAddress: { type: "string", description: "Recipient address or ENS name" },
			amount: { type: "string", description: "Amount of ETH to send" },
			network: { type: "string", description: "Network name (default: ethereum)" }
		},
		required: ["walletName", "toAddress", "amount"]
	},
	async execute({ walletName, toAddress, amount, network = 'ethereum' }: TransferEthParams): Promise<CallToolResult> {
		try {
			const wallet = await services.walletService.getWalletByName(walletName);
			const txHash = await services.transferETH(
				wallet.privateKey,
				toAddress,
				amount,
				network
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						transactionHash: txHash,
						from: wallet.address,
						to: toAddress,
						amount,
						network
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error transferring ETH: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const transferTokenFromWallet: Tool = {
	name: "transfer_token_from_wallet",
	description: "Transfer ERC20 tokens from a stored wallet to another address",
	inputSchema: {
		type: "object",
		properties: {
			walletName: { type: "string", description: "Name of the stored wallet to send from" },
			tokenAddress: { type: "string", description: "Token contract address or ENS name" },
			toAddress: { type: "string", description: "Recipient address or ENS name" },
			amount: { type: "string", description: "Amount of tokens to send" },
			network: { type: "string", description: "Network name (default: ethereum)" }
		},
		required: ["walletName", "tokenAddress", "toAddress", "amount"]
	},
	async execute({ walletName, tokenAddress, toAddress, amount, network = 'ethereum' }: TransferTokenParams): Promise<CallToolResult> {
		try {
			const wallet = await services.walletService.getWalletByName(walletName);
			const result = await services.transferERC20(
				tokenAddress,
				toAddress,
				amount,
				wallet.privateKey,
				network
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						transactionHash: result.txHash,
						from: wallet.address,
						to: toAddress,
						amount: result.amount.formatted,
						token: {
							symbol: result.token.symbol,
							decimals: result.token.decimals
						},
						network
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error transferring tokens: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};
