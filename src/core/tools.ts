import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";
import { type Address, type Hash } from 'viem';
import { normalize } from 'viem/ens';
import { registerWalletTools } from './wallet-tools.js';

/**
 * Register all EVM-related tools with the MCP server
 */
export function registerEVMTools(server: McpServer) {

  registerWalletTools(server);

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
      dexRouter: z.string().describe("DEX router contract address for liquidity pair creation"),
      developmentFund: z.string().optional().describe("Address that receives collected transaction fees (defaults to zero address)"),
      percentageBuyFee: z.number().optional().describe("Fee percentage charged on buy transactions (e.g., 5 for 5%, default: 0)"),
      percentageSellFee: z.number().optional().describe("Fee percentage charged on sell transactions (e.g., 5 for 5%, default: 0)"),
      totalSupply: z.number().optional().describe("Total supply of tokens to mint (default: 100,000,000)"),
      network: z.string().optional().describe("Network name (e.g., 'bsc', 'ethereum', 'optimism', 'arbitrum', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to BSC.")
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

  // ENS LOOKUP TOOL

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

  // BALANCE TOOLS

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

  // TRANSACTION TOOLS

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
