import {
  type Hash,
  type Hex,
  type ReadContractParameters,
  type GetLogsParameters,
  type Log,
} from 'viem';
import { getPublicClient, getWalletClient, getEnvWalletClient } from './clients.js';
export { deployERC20TokenStandard as deployERC20Token } from './token-standard-deploy.js';

/**
 * Read from a contract for a specific network
 */
export async function readContract(params: ReadContractParameters, network = 'ethereum') {
  const client = getPublicClient(network);
  return await client.readContract(params);
}

/**
 * Write to a contract for a specific network using the provided private key
 */
export async function writeContract(
  privateKey: Hex,
  params: Record<string, any>,
  network = 'ethereum'
): Promise<Hash> {
  const client = getWalletClient(privateKey, network);
  return await client.writeContract(params as any);
}

/**
 * Write to a contract for a specific network using the environment private key
 */
export async function writeContractWithEnvKey(
  params: Record<string, any>,
  network = 'ethereum'
): Promise<Hash> {
  const client = getEnvWalletClient(network);
  return await client.writeContract(params as any);
}

/**
 * Get logs for a specific network
 */
export async function getLogs(params: GetLogsParameters, network = 'ethereum'): Promise<Log[]> {
  const client = getPublicClient(network);
  return await client.getLogs(params);
}
