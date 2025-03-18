import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Hex,
  type Address
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getChain, getRpcUrl } from '../chains.js';

// Error messages
const ERROR_MESSAGES = {
  INVALID_PRIVATE_KEY: 'Invalid private key format',
  PRIVATE_KEY_NOT_SET: 'PRIVATE_KEY environment variable is not set',
  INVALID_NETWORK: 'Invalid network specified',
  CLIENT_CREATION_FAILED: 'Failed to create client'
} as const;

// Cache for clients to avoid recreating them for each request
const clientCache = new Map<string, PublicClient>();

/**
 * Validates and formats a private key
 * @throws Error if private key format is invalid
 */
function validateAndFormatPrivateKey(privateKey: string | Hex): Hex {
  const key = typeof privateKey === 'string' ? privateKey : String(privateKey);

  // Remove 0x prefix if present for validation
  const cleanKey = key.replace('0x', '');

  // Check if key is valid hex and correct length
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error(ERROR_MESSAGES.INVALID_PRIVATE_KEY);
  }

  return `0x${cleanKey}` as Hex;
}

/**
 * Get the private key from environment variables
 * @throws Error if PRIVATE_KEY is not set or invalid
 */
export function getPrivateKey(): Hex {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(ERROR_MESSAGES.PRIVATE_KEY_NOT_SET);
  }

  return validateAndFormatPrivateKey(privateKey);
}

/**
 * Get a public client for a specific network
 * @throws Error if network is invalid or client creation fails
 */
export function getPublicClient(network = 'ethereum'): PublicClient {
  const cacheKey = String(network);

  try {
    // Return cached client if available
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey)!;
    }

    // Create a new client
    const chain = getChain(network);
    const rpcUrl = getRpcUrl(network);

    const client = createPublicClient({
      chain,
      transport: http(rpcUrl)
    });

    // Cache the client
    clientCache.set(cacheKey, client);

    return client;
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.CLIENT_CREATION_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a wallet client for a specific network and private key
 * @throws Error if private key is invalid or client creation fails
 */
export function getWalletClient(privateKey: string | Hex, network = 'ethereum'): WalletClient {
  try {
    const formattedKey = validateAndFormatPrivateKey(privateKey);
    const chain = getChain(network);
    const rpcUrl = getRpcUrl(network);
    const account = privateKeyToAccount(formattedKey);

    return createWalletClient({
      account,
      chain,
      transport: http(rpcUrl)
    });
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.CLIENT_CREATION_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a wallet client using the private key from environment variables
 * @throws Error if PRIVATE_KEY is not set or client creation fails
 */
export function getEnvWalletClient(network = 'ethereum'): WalletClient {
  const privateKey = getPrivateKey();
  return getWalletClient(privateKey, network);
}

/**
 * Get an Ethereum address from a private key
 * @throws Error if private key is invalid
 */
export function getAddressFromPrivateKey(privateKey: string | Hex): Address {
  try {
    const formattedKey = validateAndFormatPrivateKey(privateKey);
    const account = privateKeyToAccount(formattedKey);
    return account.address;
  } catch (error) {
    throw new Error(`Failed to derive address: ${error instanceof Error ? error.message : String(error)}`);
  }
}
