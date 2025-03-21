export const PANCAKE_ROUTER = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
export const WBNB = '0xae13d989dac2f0debff460ac112a837c89baa7cd';
export const USDT = '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd';

export const PANCAKE_ROUTER_ABI = [
	{
		"inputs": [
			{ "internalType": "address", "name": "token", "type": "address" },
			{ "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "deadline", "type": "uint256" }
		],
		"name": "addLiquidityETH",
		"outputs": [
			{ "internalType": "uint256", "name": "amountToken", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountETH", "type": "uint256" },
			{ "internalType": "uint256", "name": "liquidity", "type": "uint256" }
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "amountIn", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
			{ "internalType": "address[]", "name": "path", "type": "address[]" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "deadline", "type": "uint256" }
		],
		"name": "swapExactTokensForETH",
		"outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
			{ "internalType": "address[]", "name": "path", "type": "address[]" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "deadline", "type": "uint256" }
		],
		"name": "swapExactETHForTokens",
		"outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "amountOut", "type": "uint256" },
			{ "internalType": "address[]", "name": "path", "type": "address[]" }
		],
		"name": "getAmountsIn",
		"outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "amountIn", "type": "uint256" },
			{ "internalType": "address[]", "name": "path", "type": "address[]" }
		],
		"name": "getAmountsOut",
		"outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
		"stateMutability": "view",
		"type": "function"
	}
];
