import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "../index.js";
import { type Address } from 'viem';

export function registerTransferTools(server: McpServer) {
	// Transfer ETH using stored wallet
	server.tool(
		"transfer_eth",
		"Transfer native tokens (BNB, ETH, etc.) to an address using a stored wallet",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			to: z.string().describe("The recipient address or ENS name (e.g., '0x1234...' or 'vitalik.eth')"),
			amount: z.string().describe("Amount to send in native token (BNB, ETH, etc.), as a string (e.g., '0.1')"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, to, amount, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const txHash = await services.transferETHWithStoredWallet(
					walletName,
					to,
					amount,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							txHash,
							to,
							amount,
							network,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error transferring native token: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Transfer ERC20 using stored wallet
	server.tool(
		"transfer_erc20",
		"Transfer ERC20 tokens to another address using a stored wallet",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			tokenAddress: z.string().describe("The address of the ERC20 token contract"),
			toAddress: z.string().describe("The recipient address"),
			amount: z.string().describe("The amount of tokens to send (in token units, e.g., '10' for 10 tokens)"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, tokenAddress, toAddress, amount, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const result = await services.transferERC20WithStoredWallet(
					walletName,
					tokenAddress as Address,
					toAddress as Address,
					amount,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							txHash: result.txHash,
							network,
							tokenAddress,
							recipient: toAddress,
							amount: result.amount.formatted,
							symbol: result.token.symbol,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error transferring ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Transfer NFT (ERC721) using stored wallet
	server.tool(
		"transfer_nft",
		"Transfer an NFT (ERC721 token) from one address to another using a stored wallet.",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			tokenAddress: z.string().describe("The contract address of the NFT collection"),
			tokenId: z.string().describe("The ID of the specific NFT to transfer (e.g., '1234')"),
			toAddress: z.string().describe("The recipient wallet address that will receive the NFT"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, tokenAddress, tokenId, toAddress, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const result = await services.transferERC721WithStoredWallet(
					walletName,
					tokenAddress as Address,
					toAddress as Address,
					BigInt(tokenId),
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							txHash: result.txHash,
							network,
							collection: tokenAddress,
							tokenId: result.tokenId,
							recipient: toAddress,
							name: result.token.name,
							symbol: result.token.symbol,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error transferring NFT: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Approve ERC20 token spending using stored wallet
	server.tool(
		"approve_token_spending",
		"Approve another address (like a DeFi protocol or exchange) to spend your ERC20 tokens using a stored wallet. This is often required before interacting with DeFi protocols.",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			tokenAddress: z.string().describe("The contract address of the ERC20 token to approve for spending (e.g., '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' for WBNB on BSC)"),
			spenderAddress: z.string().describe("The contract address being approved to spend your tokens (e.g., a DEX or lending protocol)"),
			amount: z.string().describe("The amount of tokens to approve in token units, not wei (e.g., '1000' to approve spending 1000 tokens). Use a very large number for unlimited approval."),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, tokenAddress, spenderAddress, amount, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const result = await services.approveERC20WithStoredWallet(
					walletName,
					tokenAddress as Address,
					spenderAddress as Address,
					amount,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							txHash: result.txHash,
							network,
							tokenAddress,
							spender: spenderAddress,
							amount: result.amount.formatted,
							symbol: result.token.symbol,
							fromWallet: walletName
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error approving token spending: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);
}
