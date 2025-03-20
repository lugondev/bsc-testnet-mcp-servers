# Changelog

## [Unreleased]
### Changed
- Changed default network from Ethereum to BSC
  - Updated all tools and services to default to BSC network
  - Updated wallet transfer functions to prioritize BSC
  - Updated transaction services to use BSC by default
  - Updated examples to use BSC contract addresses
  - Added proper BNB/native token references in documentation
  - Modified network descriptions to prioritize BSC
- Replaced environment private key with stored wallet functionality
  - Removed PRIVATE_KEY environment variable dependency
  - Added stored wallet support for all transaction operations
  - Added explicit wallet name selection for all transactions
  - Removed automatic wallet selection for better security
  - Added wallet verification before transactions
  - Updated error messages to guide users to select valid wallets
  - Improved security by storing wallets in database
- Refactored wallet tools for better organization and maintainability
  - Split wallet-tools.ts into modular components (transfer, swap, manage)
  - Improved type safety with proper TypeScript interfaces
  - Added better error handling and input validation
  - Extracted PancakeSwap constants to separate file
  - Converted tool schemas to use Zod for better type safety
- Separated token deployment functionality into dedicated file
  - Moved ERC20 token deployment logic to token-deploy.ts
  - Improved contracts.ts maintainability by reducing file size
  - Better code organization through modular architecture
### Added
- ENS name resolution support for all address parameters
- Support for 30+ EVM networks including testnets
- Integration with Cursor through mcp.json configuration
- HTTP server mode with SSE support for web applications
- Standard and tax token deployment tools
  - Standard ERC20 token deployment with configurable parameters
  - Tax token deployment with DEX integration
  - Support for UniswapV2Router02 and PancakeRouter
  - Configurable buy/sell fee percentages
  - Development fund for collecting fees
  - Automatic liquidity pair creation
### Added
- Add liquidity ETH functionality for Uniswap and PancakeSwap
  - Support for adding ETH/token liquidity to both DEXs
  - Configurable slippage tolerance
  - Automatic price calculation and validation
  - Support for both Ethereum and BSC networks
  - Proper error handling and transaction validation
