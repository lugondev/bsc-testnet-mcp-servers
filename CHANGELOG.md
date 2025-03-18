# Changelog

## [Unreleased]
### Changed
- Refactored wallet tools for better organization and maintainability
  - Split wallet-tools.ts into modular components (transfer, swap, manage)
  - Improved type safety with proper TypeScript interfaces
  - Added better error handling and input validation
  - Extracted PancakeSwap constants to separate file
  - Converted tool schemas to use Zod for better type safety
### Added
- ENS name resolution support for all address parameters
- Support for 30+ EVM networks including testnets
- Integration with Cursor through mcp.json configuration
- HTTP server mode with SSE support for web applications
