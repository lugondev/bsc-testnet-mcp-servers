import { type Hex, parseEther, parseUnits } from 'viem';
import { getWalletClient, getPublicClient } from './clients.js';
import {
	PANCAKE_ROUTER,
	PANCAKE_ROUTER_ABI,
	WBNB,
	USDT
} from '../constants/pancakeswap.js';

// Utility functions
const validateAmount = (amount: string): void => {
	const num = Number(amount);
	if (isNaN(num) || num <= 0) {
		throw new Error('Invalid amount: must be a positive number');
	}
};

const validateSlippage = (slippage: number): void => {
	if (isNaN(slippage) || slippage < 0 || slippage > 100) {
		throw new Error('Invalid slippage: must be between 0 and 100');
	}
};

const getSwapDeadline = (minutes = 20): bigint => {
	return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
};

/** Helper class for PancakeSwap Router operations */
export class RouterService {
	/**
	 * Calculate the minimum ETH to receive based on USDT input
	 * @throws Error if amount is invalid or calculation fails
	 */
	private async calculateETHToReceive(
		amountIn: string,
		network = 'bsc-testnet'
	): Promise<string> {
		validateAmount(amountIn);

		const client = getPublicClient(network);
		const amountInWei = parseUnits(amountIn, 18);
		const path = [USDT, WBNB];

		try {
			const amounts = await client.readContract({
				address: PANCAKE_ROUTER,
				abi: PANCAKE_ROUTER_ABI,
				functionName: 'getAmountsOut',
				args: [amountInWei, path]
			}) as bigint[];

			const ethAmount = amounts[amounts.length - 1];
			return (Number(ethAmount) / 1e18).toString();
		} catch (error) {
			throw new Error(`Failed to calculate ETH output: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Calculate the amount of ETH needed to receive the desired amount of USDT
	 * @throws Error if amount is invalid or calculation fails
	 */
	async calculateETHNeeded(
		amountOut: string,
		network = 'bsc-testnet'
	): Promise<string> {
		validateAmount(amountOut);

		const client = getPublicClient(network);
		const amountOutWei = parseUnits(amountOut, 18);
		const path = [WBNB, USDT];

		try {
			const amounts = await client.readContract({
				address: PANCAKE_ROUTER,
				abi: PANCAKE_ROUTER_ABI,
				functionName: 'getAmountsIn',
				args: [amountOutWei, path]
			}) as bigint[];

			const ethAmount = amounts[0];
			return (Number(ethAmount) / 1e18).toString();
		} catch (error) {
			throw new Error(`Failed to calculate required ETH: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Execute swap through PancakeSwap Router to buy USDT
	 * @throws Error if parameters are invalid or swap fails
	 */
	async executeBuyUSDT(
		privKey: string | Hex,
		usdtAmount: string,
		slippagePercent = 0.5,
		network = 'bsc-testnet'
	): Promise<`0x${string}`> {
		validateAmount(usdtAmount);
		validateSlippage(slippagePercent);

		const client = getWalletClient(privKey, network);
		if (!client.account) throw new Error('Failed to initialize wallet client');

		try {
			const ethNeeded = await this.calculateETHNeeded(usdtAmount, network);
			const slippageMultiplier = 1 - (slippagePercent / 100);
			const minUSDTToReceive = (Number(usdtAmount) * slippageMultiplier).toString();

			const amountOutMin = parseUnits(minUSDTToReceive, 18);
			const path = [WBNB, USDT];
			const deadline = getSwapDeadline();
			const value = parseEther(ethNeeded);

			return await client.writeContract({
				address: PANCAKE_ROUTER,
				abi: PANCAKE_ROUTER_ABI,
				functionName: 'swapExactETHForTokens',
				args: [amountOutMin, path, client.account.address, deadline],
				value,
				account: client.account,
				chain: client.chain
			});
		} catch (error) {
			throw new Error(`Swap failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Execute swap through PancakeSwap Router to sell USDT
	 * @throws Error if parameters are invalid or swap fails
	 */
	async executeSellUSDT(
		privKey: string | Hex,
		usdtAmount: string,
		slippagePercent = 0.5,
		network = 'bsc-testnet'
	): Promise<`0x${string}`> {
		validateAmount(usdtAmount);
		validateSlippage(slippagePercent);

		const client = getWalletClient(privKey, network);
		if (!client.account) throw new Error('Failed to initialize wallet client');

		try {
			const ethToReceive = await this.calculateETHToReceive(usdtAmount, network);
			const slippageMultiplier = 1 - (slippagePercent / 100);
			const minETHToReceive = (Number(ethToReceive) * slippageMultiplier).toString();

			const amountIn = parseUnits(usdtAmount, 18);
			const amountOutMin = parseEther(minETHToReceive);
			const path = [USDT, WBNB];
			const deadline = getSwapDeadline();

			return await client.writeContract({
				address: PANCAKE_ROUTER,
				abi: PANCAKE_ROUTER_ABI,
				functionName: 'swapExactTokensForETH',
				args: [amountIn, amountOutMin, path, client.account.address, deadline],
				account: client.account,
				chain: client.chain
			});
		} catch (error) {
			throw new Error(`Swap failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

export const routerService = new RouterService();
