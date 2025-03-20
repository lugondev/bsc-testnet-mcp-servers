import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "../index.js";
import { parseEther, zeroAddress, type Address } from 'viem';

const LOCK_CONTRACT_ADDRESS = "0xc765bddb93b0d1c1a88282ba0fa6b2d00e3e0c83" as Address;

export function registerWriteTools(server: McpServer) {
	// Write to contract using stored wallet
	server.tool(
		"write_contract",
		"Write data to a smart contract by calling a state-changing function using a stored wallet. This modifies blockchain state and requires gas payment and transaction signing.",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			contractAddress: z.string().describe("The address of the smart contract to interact with"),
			abi: z.array(z.any()).describe("The ABI (Application Binary Interface) of the smart contract function, as a JSON array"),
			functionName: z.string().describe("The name of the function to call on the contract (e.g., 'transfer')"),
			args: z.array(z.any()).describe("The arguments to pass to the function, as an array (e.g., ['0x1234...', '1000000000000000000'])"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
		},
		async ({ walletName, contractAddress, abi, functionName, args, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				// Parse ABI if it's a string
				const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;

				const contractParams: Record<string, any> = {
					address: contractAddress as Address,
					abi: parsedAbi,
					functionName,
					args
				};

				const txHash = await services.writeContractWithStoredWallet(
					walletName,
					contractParams,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							network,
							transactionHash: txHash,
							fromWallet: walletName,
							message: "Contract write transaction sent successfully"
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error writing to contract: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Add liquidity ETH to PancakeSwap pair
	server.tool(
		"add_liquidity",
		"Add ETH and token liquidity to create or increase a Uniswap/PancakeSwap liquidity pool position",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			tokenAddress: z.string().describe("The ERC20 token contract address to pair with ETH"),
			amountToken: z.string().describe("Amount of tokens to add as liquidity (in token units)"),
			amountETH: z.string().describe("Amount of ETH to add as liquidity (in ETH units)"),
			dexRouter: z.string().describe("DEX router contract address for liquidity pair creation"),
			slippage: z.number().optional().describe("Maximum allowed slippage percentage (default: 0.5)"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', etc.) or chain ID. Defaults to BSC.")
		},
		async ({ walletName, tokenAddress, dexRouter, amountToken, amountETH, slippage = 0.5, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				// Get wallet private key
				const wallet = await services.walletService.getWalletByName(walletName);

				const txHash = await services.routerService.addLiquidityETH(
					wallet.privateKey,
					tokenAddress,
					amountToken,
					amountETH,
					slippage,
					dexRouter,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: txHash,
							tokenAddress,
							amountToken,
							amountETH,
							fromWallet: walletName,
							message: "Successfully added liquidity to PancakeSwap pool"
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error adding liquidity: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Lock LP tokens in UniswapV2Lock contract
	server.tool(
		"lock_lp_token",
		"Lock LP tokens in the UniswapV2Lock contract to demonstrate locked liquidity",
		{
			walletName: z.string().describe("The name of the stored wallet to use for the transaction"),
			lpTokenAddress: z.string().describe("The LP token address to lock"),
			amount: z.string().describe("Amount of LP tokens to lock (in LP token units)"),
			unlockDate: z.number().describe("Unix timestamp when tokens can be unlocked"),
			network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', etc.) or chain ID. Defaults to BSC.")
		},
		async ({ walletName, lpTokenAddress, amount, unlockDate, network = "bsc" }) => {
			try {
				// Verify the wallet exists
				await services.walletService.getWalletByName(walletName);

				const wallet = await services.walletService.getWalletByName(walletName);

				// Prepare args for lockLPToken function
				const args = [
					lpTokenAddress,
					amount,
					unlockDate,
					zeroAddress, // Referral address
					true, // Fee in ETH
					wallet.address // If no withdrawer specified, use sender address
				];

				const contractParams = {
					address: LOCK_CONTRACT_ADDRESS,
					abi: [{
						"inputs": [
							{ "internalType": "address", "name": "_lpToken", "type": "address" },
							{ "internalType": "uint256", "name": "_amount", "type": "uint256" },
							{ "internalType": "uint256", "name": "_unlock_date", "type": "uint256" },
							{ "internalType": "address payable", "name": "_referral", "type": "address" },
							{ "internalType": "bool", "name": "_fee_in_eth", "type": "bool" },
							{ "internalType": "address payable", "name": "_withdrawer", "type": "address" }
						],
						"name": "lockLPToken",
						"outputs": [],
						"stateMutability": "payable",
						"type": "function"
					}],
					functionName: 'lockLPToken',
					args,
					value: parseEther("0.2") // Send 0.2 ETH as fee
				};

				const txHash = await services.writeContractWithStoredWallet(
					walletName,
					contractParams,
					network
				);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							success: true,
							network,
							transactionHash: txHash,
							lpTokenAddress,
							amount,
							unlockDate,
							fromWallet: walletName,
							message: "Successfully locked LP tokens in UniswapV2Lock contract"
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error locking LP tokens: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);
}
