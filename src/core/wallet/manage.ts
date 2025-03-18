import { type Tool, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Hex } from 'viem';
import * as services from "../services/index.js";

type CreateWalletParams = {
	name: string;
};

type ImportWalletParams = {
	name: string;
	privateKey: string;
};

type GetStoredWalletParams = {
	identifier: string;
	lookupBy: 'name' | 'address';
};

export const createWallet: Tool = {
	name: "create_wallet",
	description: "Create a new EVM wallet and store it securely in the database with a friendly name",
	inputSchema: {
		type: "object",
		properties: {
			name: { type: "string", description: "A friendly name for the wallet (must be unique)" }
		},
		required: ["name"]
	},
	async execute({ name }: CreateWalletParams): Promise<CallToolResult> {
		try {
			const result = await services.walletService.createWallet(name);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						...result
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error creating wallet: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const importWallet: Tool = {
	name: "import_private_key",
	description: "Import an existing private key and store it as a named wallet",
	inputSchema: {
		type: "object",
		properties: {
			name: { type: "string", description: "A friendly name for the wallet (must be unique)" },
			privateKey: { type: "string", description: "Private key in hex format (with or without 0x prefix)" }
		},
		required: ["name", "privateKey"]
	},
	async execute({ name, privateKey }: ImportWalletParams): Promise<CallToolResult> {
		try {
			const result = await services.walletService.importWallet(name, privateKey);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						...result
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error importing private key: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const getStoredWallet: Tool = {
	name: "get_stored_wallet",
	description: "Get information about a stored wallet by its name or address",
	inputSchema: {
		type: "object",
		properties: {
			identifier: { type: "string", description: "The wallet name or address to look up" },
			lookupBy: { type: "string", enum: ["name", "address"], description: "Whether to look up by name or address" }
		},
		required: ["identifier", "lookupBy"]
	},
	async execute({ identifier, lookupBy }: GetStoredWalletParams): Promise<CallToolResult> {
		try {
			const wallet = lookupBy === 'name'
				? await services.walletService.getWalletByName(identifier)
				: await services.walletService.getWalletByAddress(identifier);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						id: wallet.id,
						name: wallet.name,
						address: wallet.address,
						createdAt: wallet.createdAt,
						updatedAt: wallet.updatedAt
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error retrieving wallet: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const listWallets: Tool = {
	name: "list_wallets",
	description: "Get a list of all stored wallets ordered by creation date",
	inputSchema: {
		type: "object",
		properties: {},
		required: []
	},
	async execute(): Promise<CallToolResult> {
		try {
			const wallets = await services.walletService.getWallets();

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						success: true,
						wallets
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error listing wallets: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};

export const getAddressFromPrivateKey: Tool = {
	name: "get_address_from_private_key",
	description: "Get the EVM address derived from a private key",
	inputSchema: {
		type: "object",
		properties: {
			privateKey: {
				type: "string",
				description: "Private key in hex format (with or without 0x prefix). SECURITY: This is used only for address derivation and is not stored."
			}
		},
		required: ["privateKey"]
	},
	async execute({ privateKey }: { privateKey: string }): Promise<CallToolResult> {
		try {
			const formattedKey = privateKey.startsWith('0x') ? privateKey as Hex : `0x${privateKey}` as Hex;
			const address = services.getAddressFromPrivateKey(formattedKey);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						address,
						privateKey: "0x" + privateKey.replace(/^0x/, '')
					}, null, 2)
				}]
			};
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `Error deriving address from private key: ${error instanceof Error ? error.message : String(error)}`
				}],
				isError: true
			};
		}
	}
};
