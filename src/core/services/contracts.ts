import {
  type Hash,
  type Hex,
  type ReadContractParameters,
  type GetLogsParameters,
  type Log,
} from 'viem';
import { getPublicClient, getWalletClient, getStoredWalletClient } from './clients.js';
export { deployERC20TokenStandard as deployERC20Token } from './token-standard-deploy.js';

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
