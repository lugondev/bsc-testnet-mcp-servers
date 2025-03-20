import {
	parseEther,
	parseUnits,
	type Address,
	type Hash,
	type Hex,
	getContract,
} from 'viem';
import { getPublicClient, getWalletClient, getStoredWalletClient } from './clients.js';
import { resolveAddress } from './ens.js';

// Standard ERC20 ABI for transfers
const erc20TransferAbi = [
	{
		inputs: [
			{ type: 'address', name: 'to' },
			{ type: 'uint256', name: 'amount' }
		],
		name: 'transfer',
		outputs: [{ type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ type: 'address', name: 'spender' },
			{ type: 'uint256', name: 'amount' }
		],
		name: 'approve',
		outputs: [{ type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
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

// Standard ERC721 ABI for transfers
const erc721TransferAbi = [
	{
		inputs: [
			{ type: 'address', name: 'from' },
			{ type: 'address', name: 'to' },
			{ type: 'uint256', name: 'tokenId' }
		],
		name: 'transferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'name',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'tokenId' }],
		name: 'ownerOf',
		outputs: [{ type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// ERC1155 ABI for transfers
const erc1155TransferAbi = [
	{
		inputs: [
			{ type: 'address', name: 'from' },
			{ type: 'address', name: 'to' },
			{ type: 'uint256', name: 'id' },
			{ type: 'uint256', name: 'amount' },
			{ type: 'bytes', name: 'data' }
		],
		name: 'safeTransferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ type: 'address', name: 'account' },
			{ type: 'uint256', name: 'id' }
		],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

/**
 * Transfer native token to an address
 * @param privateKey Sender's private key
 * @param toAddressOrEns Recipient address or ENS name
 * @param amount Amount to send in native token (BNB, ETH, etc.)
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction hash
 */
export async function transferETH(
	privateKey: string | Hex,
	toAddressOrEns: string,
	amount: string,
	network = 'bsc'
): Promise<Hash> {
	// Resolve ENS name to address if needed
	const toAddress = await resolveAddress(toAddressOrEns, network);

	// Ensure the private key has 0x prefix
	const formattedKey = typeof privateKey === 'string' && !privateKey.startsWith('0x')
		? `0x${privateKey}` as Hex
		: privateKey as Hex;

	const client = getWalletClient(formattedKey, network);
	const amountWei = parseEther(amount);

	return client.sendTransaction({
		to: toAddress,
		value: amountWei,
		account: client.account!,
		chain: client.chain
	});
}

/**
 * Transfer ERC20 tokens to an address
 * @param tokenAddressOrEns Token contract address or ENS name
 * @param toAddressOrEns Recipient address or ENS name
 * @param amount Amount to send (in token units)
 * @param privateKey Sender's private key
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction details
 */
export async function transferERC20(
	tokenAddressOrEns: string,
	toAddressOrEns: string,
	amount: string,
	privateKey: string | `0x${string}`,
	network = 'bsc'
): Promise<{
	txHash: Hash;
	amount: {
		raw: bigint;
		formatted: string;
	};
	token: {
		symbol: string;
		decimals: number;
	};
}> {
	// Resolve ENS names to addresses if needed
	const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
	const toAddress = await resolveAddress(toAddressOrEns, network) as Address;

	// Ensure the private key has 0x prefix
	const formattedKey = typeof privateKey === 'string' && !privateKey.startsWith('0x')
		? `0x${privateKey}` as `0x${string}`
		: privateKey as `0x${string}`;

	// Get token details
	const publicClient = getPublicClient(network);
	const contract = getContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		client: publicClient,
	});

	// Get token decimals and symbol
	const decimals = await contract.read.decimals();
	const symbol = await contract.read.symbol();

	// Parse the amount with the correct number of decimals
	const rawAmount = parseUnits(amount, decimals);

	// Create wallet client for sending the transaction
	const walletClient = getWalletClient(formattedKey, network);

	// Send the transaction
	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		functionName: 'transfer',
		args: [toAddress, rawAmount],
		account: walletClient.account!,
		chain: walletClient.chain
	});

	return {
		txHash: hash,
		amount: {
			raw: rawAmount,
			formatted: amount
		},
		token: {
			symbol,
			decimals
		}
	};
}

/**
 * Transfer native token (BNB, ETH, etc.) to an address using a stored wallet
 * @param walletName Name of the stored wallet to use
 * @param toAddressOrEns Recipient address or ENS name
 * @param amount Amount to send in native token
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction hash
 */
export async function transferETHWithStoredWallet(
	walletName: string,
	toAddressOrEns: string,
	amount: string,
	network = 'bsc'
): Promise<Hash> {
	// Resolve ENS name to address if needed
	const toAddress = await resolveAddress(toAddressOrEns, network);

	// Get wallet client with stored wallet
	const client = await getStoredWalletClient(walletName, network);
	const amountWei = parseEther(amount);

	return client.sendTransaction({
		to: toAddress,
		value: amountWei,
		account: client.account!,
		chain: client.chain
	});
}

/**
 * Transfer ERC20 tokens to an address using a stored wallet
 * @param walletName Name of the stored wallet to use
 * @param tokenAddressOrEns Token contract address or ENS name
 * @param toAddressOrEns Recipient address or ENS name
 * @param amount Amount to send (in token units)
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction details
 */
export async function transferERC20WithStoredWallet(
	walletName: string,
	tokenAddressOrEns: string,
	toAddressOrEns: string,
	amount: string,
	network = 'bsc'
): Promise<{
	txHash: Hash;
	amount: {
		raw: bigint;
		formatted: string;
	};
	token: {
		symbol: string;
		decimals: number;
	};
}> {
	// Resolve ENS names to addresses if needed
	const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
	const toAddress = await resolveAddress(toAddressOrEns, network) as Address;

	// Get token details
	const publicClient = getPublicClient(network);
	const contract = getContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		client: publicClient,
	});

	// Get token decimals and symbol
	const decimals = await contract.read.decimals();
	const symbol = await contract.read.symbol();

	// Parse the amount with the correct number of decimals
	const rawAmount = parseUnits(amount, decimals);

	// Create wallet client for sending the transaction
	const walletClient = await getStoredWalletClient(walletName, network);

	// Send the transaction
	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		functionName: 'transfer',
		args: [toAddress, rawAmount],
		account: walletClient.account!,
		chain: walletClient.chain
	});

	return {
		txHash: hash,
		amount: {
			raw: rawAmount,
			formatted: amount
		},
		token: {
			symbol,
			decimals
		}
	};
}

/**
 * Approve ERC20 token spending using a stored wallet
 * @param walletName Name of the stored wallet to use
 * @param tokenAddressOrEns Token contract address or ENS name
 * @param spenderAddressOrEns Spender address or ENS name
 * @param amount Amount to approve (in token units)
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction details
 */
export async function approveERC20WithStoredWallet(
	walletName: string,
	tokenAddressOrEns: string,
	spenderAddressOrEns: string,
	amount: string,
	network = 'bsc'
): Promise<{
	txHash: Hash;
	amount: {
		raw: bigint;
		formatted: string;
	};
	token: {
		symbol: string;
		decimals: number;
	};
}> {
	// Resolve ENS names to addresses if needed
	const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
	const spenderAddress = await resolveAddress(spenderAddressOrEns, network) as Address;

	// Get token details
	const publicClient = getPublicClient(network);
	const contract = getContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		client: publicClient,
	});

	// Get token decimals and symbol
	const decimals = await contract.read.decimals();
	const symbol = await contract.read.symbol();

	// Parse the amount with the correct number of decimals
	const rawAmount = parseUnits(amount, decimals);

	// Create wallet client for sending the transaction
	const walletClient = await getStoredWalletClient(walletName, network);

	// Send the transaction
	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc20TransferAbi,
		functionName: 'approve',
		args: [spenderAddress, rawAmount],
		account: walletClient.account!,
		chain: walletClient.chain
	});

	return {
		txHash: hash,
		amount: {
			raw: rawAmount,
			formatted: amount
		},
		token: {
			symbol,
			decimals
		}
	};
}

/**
 * Transfer an NFT (ERC721) to an address using a stored wallet
 * @param walletName Name of the stored wallet to use
 * @param tokenAddressOrEns NFT contract address or ENS name
 * @param toAddressOrEns Recipient address or ENS name
 * @param tokenId Token ID to transfer
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction details
 */
export async function transferERC721WithStoredWallet(
	walletName: string,
	tokenAddressOrEns: string,
	toAddressOrEns: string,
	tokenId: bigint,
	network = 'bsc'
): Promise<{
	txHash: Hash;
	tokenId: string;
	token: {
		name: string;
		symbol: string;
	};
}> {
	// Resolve ENS names to addresses if needed
	const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
	const toAddress = await resolveAddress(toAddressOrEns, network) as Address;

	// Create wallet client for sending the transaction
	const walletClient = await getStoredWalletClient(walletName, network);
	const fromAddress = walletClient.account!.address;

	// Send the transaction
	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc721TransferAbi,
		functionName: 'transferFrom',
		args: [fromAddress, toAddress, tokenId],
		account: walletClient.account!,
		chain: walletClient.chain
	});

	// Get token metadata
	const publicClient = getPublicClient(network);
	const contract = getContract({
		address: tokenAddress,
		abi: erc721TransferAbi,
		client: publicClient,
	});

	// Get token name and symbol
	let name = 'Unknown';
	let symbol = 'NFT';

	try {
		[name, symbol] = await Promise.all([
			contract.read.name(),
			contract.read.symbol()
		]);
	} catch (error) {
		console.error('Error fetching NFT metadata:', error);
	}

	return {
		txHash: hash,
		tokenId: tokenId.toString(),
		token: {
			name,
			symbol
		}
	};
}

/**
 * Transfer ERC1155 tokens using a stored wallet
 * @param walletName Name of the stored wallet to use
 * @param tokenAddressOrEns Token contract address or ENS name
 * @param toAddressOrEns Recipient address or ENS name
 * @param tokenId Token ID to transfer
 * @param amount Amount to transfer
 * @param network Network name or chain ID, defaults to BSC
 * @returns Transaction details
 */
export async function transferERC1155WithStoredWallet(
	walletName: string,
	tokenAddressOrEns: string,
	toAddressOrEns: string,
	tokenId: bigint,
	amount: string,
	network = 'bsc'
): Promise<{
	txHash: Hash;
	tokenId: string;
	amount: string;
}> {
	// Resolve ENS names to addresses if needed
	const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
	const toAddress = await resolveAddress(toAddressOrEns, network) as Address;

	// Create wallet client for sending the transaction
	const walletClient = await getStoredWalletClient(walletName, network);
	const fromAddress = walletClient.account!.address;

	// Parse amount to bigint
	const amountBigInt = BigInt(amount);

	// Send the transaction
	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc1155TransferAbi,
		functionName: 'safeTransferFrom',
		args: [fromAddress, toAddress, tokenId, amountBigInt, '0x'],
		account: walletClient.account!,
		chain: walletClient.chain
	});

	return {
		txHash: hash,
		tokenId: tokenId.toString(),
		amount
	};
}
