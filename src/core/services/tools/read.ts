import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "../index.js";
import { type Address, type Hash } from 'viem';
import { normalize } from 'viem/ens';
import { getSupportedNetworks, getRpcUrl } from "../../chains.js";

export function registerReadTools(server: McpServer) {
	// Get chain information
	server.tool(
		"get_chain_info",
		"Get information about an EVM network",
		{
			network: z.string().optional().describe("Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet.")
		},
		async ({ network = "bsc" }) => {
			try {
				const chainId = await services.getChainId(network);
				const blockNumber = await services.getBlockNumber(network);
				const rpcUrl = getRpcUrl(network);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							network,
							chainId,
							blockNumber: blockNumber.toString(),
							rpcUrl
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Resolve ENS name to address
	server.tool(
		"resolve_ens",
		"Resolve an ENS name to an Ethereum address",
		{
			ensName: z.string().describe("ENS name to resolve (e.g., 'vitalik.eth')"),
			network: z.string().optional().describe("Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. ENS resolution works best on Ethereum mainnet. Defaults to Ethereum mainnet.")
		},
		async ({ ensName, network = "bsc" }) => {
			try {
				// Validate that the input is an ENS name
				if (!ensName.includes('.')) {
					return {
						content: [{
							type: "text",
							text: `Error: Input "${ensName}" is not a valid ENS name. ENS names must contain a dot (e.g., 'name.eth').`
						}],
						isError: true
					};
				}

				// Normalize the ENS name
				const normalizedEns = normalize(ensName);

				// Resolve the ENS name to an address
				const address = await services.resolveAddress(ensName, network);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							ensName: ensName,
							normalizedName: normalizedEns,
							resolvedAddress: address,
							network
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error resolving ENS name: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get supported networks
	server.tool(
		"get_supported_networks",
		"Get a list of supported EVM networks",
		{},
		async () => {
			try {
				const networks = getSupportedNetworks();

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							supportedNetworks: networks
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching supported networks: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get latest block
	server.tool(
		"get_latest_block",
		"Get the latest block from the EVM",
		{
			network: z.string().optional().describe("Network name or chain ID. Defaults to Ethereum mainnet.")
		},
		async ({ network = "bsc" }) => {
			try {
				const block = await services.getLatestBlock(network);

				return {
					content: [{
						type: "text",
						text: services.helpers.formatJson(block)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching latest block: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get ETH balance
	server.tool(
		"get_balance",
		"Get the native token balance (ETH, MATIC, etc.) for an address",
		{
			address: z.string().describe("The wallet address or ENS name (e.g., '0x1234...' or 'vitalik.eth') to check the balance for"),
			network: z.string().optional().describe("Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet.")
		},
		async ({ address, network = "bsc" }) => {
			try {
				const balance = await services.getETHBalance(address, network);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							address,
							network,
							wei: balance.wei.toString(),
							ether: balance.ether
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get ERC20 token balance
	server.tool(
		"get_token_balance",
		"Get the balance of an ERC20 token for an address",
		{
			tokenAddress: z.string().describe("The contract address or ENS name of the ERC20 token (e.g., '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' for USDC or 'uniswap.eth')"),
			ownerAddress: z.string().describe("The wallet address or ENS name to check the balance for (e.g., '0x1234...' or 'vitalik.eth')"),
			network: z.string().optional().describe("Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet.")
		},
		async ({ tokenAddress, ownerAddress, network = "bsc" }) => {
			try {
				const balance = await services.getERC20Balance(tokenAddress, ownerAddress, network);

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							tokenAddress,
							owner: ownerAddress,
							network,
							raw: balance.raw.toString(),
							formatted: balance.formatted,
							symbol: balance.token.symbol,
							decimals: balance.token.decimals
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get transaction by hash
	server.tool(
		"get_transaction",
		"Get detailed information about a specific transaction by its hash. Includes sender, recipient, value, data, and more.",
		{
			txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
			network: z.string().optional().describe("Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', 'polygon') or chain ID. Defaults to Ethereum mainnet.")
		},
		async ({ txHash, network = "bsc" }) => {
			try {
				const tx = await services.getTransaction(txHash as Hash, network);

				return {
					content: [{
						type: "text",
						text: services.helpers.formatJson(tx)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching transaction ${txHash}: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);

	// Get transaction receipt
	server.tool(
		"get_transaction_receipt",
		"Get a transaction receipt by its hash",
		{
			txHash: z.string().describe("The transaction hash to look up"),
			network: z.string().optional().describe("Network name or chain ID. Defaults to Ethereum mainnet.")
		},
		async ({ txHash, network = "bsc" }) => {
			try {
				const receipt = await services.getTransactionReceipt(txHash as Hash, network);

				return {
					content: [{
						type: "text",
						text: services.helpers.formatJson(receipt)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error fetching transaction receipt ${txHash}: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		}
	);
}
