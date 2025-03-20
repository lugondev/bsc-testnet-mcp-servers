import {
  type Hash,
  type Hex,
  type ReadContractParameters,
  type GetLogsParameters,
  type Log,
  getContract,
  parseUnits,
} from 'viem';
import { getPublicClient, getWalletClient, getStoredWalletClient } from './clients.js';
export { deployERC20TokenStandard as deployERC20Token } from './token-standard-deploy.js';

// ERC20 ABI 
const erc20InfoAbi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

/**
 * Enable trading for a tax token contract
 */
export async function setSwapAndLiquifyEnabled(
  contractAddress: string,
  enabled: boolean,
  walletName: string,
  network = 'bsc'
): Promise<Hash> {
  const client = await getStoredWalletClient(walletName, network);

  return await client.writeContract({
    address: contractAddress as `0x${string}`,
    chain: client.chain,
    account: client.account!,
    abi: [{
      inputs: [
        {
          internalType: "bool",
          name: "_enabled",
          type: "bool"
        }
      ],
      name: "setSwapAndLiquifyEnabled",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }],
    functionName: 'setSwapAndLiquifyEnabled',
    args: [enabled]
  });
}

export async function enableTrading(
  tokenAddress: string,
  maxHolder: string,
  maxBuy: string,
  swapAtAmount: string,
  walletName: string,
  network = 'bsc'
): Promise<Hash> {
  const client = await getStoredWalletClient(walletName, network);
  // Get token details
  const publicClient = getPublicClient(network);
  const contract = getContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20InfoAbi,
    client: publicClient,
  });

  // Get token decimals and symbol
  const decimals = await contract.read.decimals();

  // Parse the amount with the correct number of decimals
  const rawMaxHolder = parseUnits(maxHolder, decimals);
  const rawMaxBuy = parseUnits(maxBuy, decimals);
  const rawSwapAtAmount = parseUnits(swapAtAmount, decimals);

  return await client.writeContract({
    address: tokenAddress as `0x${string}`,
    chain: client.chain,
    account: client.account!,
    abi: [{
      inputs: [
        {
          internalType: "uint256",
          name: "_maxHolder",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "maxBuy",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "_swapAtAmt",
          type: "uint256"
        }
      ],
      name: "enableTrading",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }],
    functionName: 'enableTrading',
    args: [rawMaxHolder, rawMaxBuy, rawSwapAtAmount]
  });
}

/**
 * Read from a contract for a specific network
 */
/**
 * Default network is set to BSC for all contract interactions
 */

export async function readContract(params: ReadContractParameters, network = 'bsc') {
  const client = getPublicClient(network);
  return await client.readContract(params);
}

/**
 * Write to a contract for a specific network using the provided private key
 */
export async function writeContract(
  privateKey: Hex,
  params: Record<string, any>,
  network = 'bsc'
): Promise<Hash> {
  const client = getWalletClient(privateKey, network);
  return await client.writeContract(params as any);
}

/**
 * Write to a contract for a specific network using a stored wallet
 */
export async function writeContractWithStoredWallet(
  walletName: string,
  params: Record<string, any>,
  network = 'bsc'
): Promise<Hash> {
  const client = await getStoredWalletClient(walletName, network);
  return await client.writeContract(params as any);
}

/**
 * Get logs for a specific network
 */
export async function getLogs(params: GetLogsParameters, network = 'bsc'): Promise<Log[]> {
  const client = getPublicClient(network);
  return await client.getLogs(params);
}
