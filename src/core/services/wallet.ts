import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { type Hex } from 'viem'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class WalletService {
	async createWallet(name: string) {
		const privateKey = generatePrivateKey()
		const account = privateKeyToAccount(privateKey)

		const wallet = await prisma.wallet.create({
			data: {
				name,
				address: account.address,
				privateKey: privateKey,
			},
		})

		return {
			id: wallet.id,
			name: wallet.name,
			address: wallet.address,
		}
	}

	async getWalletByAddress(address: string) {
		const wallet = await prisma.wallet.findUnique({
			where: {
				address: address.toLowerCase(),
			},
		})

		if (!wallet) {
			throw new Error(`Wallet not found for address: ${address}`)
		}

		return wallet
	}

	async getWalletByName(name: string) {
		const wallet = await prisma.wallet.findUnique({
			where: {
				name,
			},
		})

		if (!wallet) {
			throw new Error(`Wallet not found with name: ${name}`)
		}

		return wallet
	}

	async getWallets() {
		const wallets = await prisma.wallet.findMany({
			orderBy: {
				createdAt: 'desc'
			},
			select: {
				id: true,
				name: true,
				address: true,
				createdAt: true,
				updatedAt: true,
			}
		})

		return wallets
	}

	async importWallet(name: string, privateKey: string) {
		// Ensure private key has 0x prefix
		const formattedKey = privateKey.startsWith('0x') ? privateKey as Hex : `0x${privateKey}` as Hex
		const account = privateKeyToAccount(formattedKey)

		const wallet = await prisma.wallet.create({
			data: {
				name,
				address: account.address,
				privateKey: formattedKey,
			},
		})

		return {
			id: wallet.id,
			name: wallet.name,
			address: wallet.address,
		}
	}
}

export const walletService = new WalletService()
