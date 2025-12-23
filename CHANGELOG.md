# Changelog

All notable changes to the Fabriquant SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-22

### Major Rebranding

This release represents a complete rebranding of the project from "Fabricant" to "Fabriquant" with updated naming conventions for all components.

#### Project Naming
- **BREAKING**: Renamed project from `fabricant` to `fabriquant`
- **BREAKING**: Package name changed from `@fabricant/sdk` to `@fabriquant/sdk`
- Updated all documentation and examples to reflect new branding

#### Component Naming Changes

The component naming has been simplified and clarified:

| Old Name | New Name | Backward Compatibility |
|----------|----------|------------------------|
| Fabric Pulse | Risk | Class still exported as `Pulsar` |
| Fabric Weave | Privacy | Provider identifier remains `"arbor"` |
| Fabric Core | FabricCore | ✅ No change needed |
| Fabricant Suite | Fabriquant Suite | Updated to new name |

**Note**: Backward compatibility is maintained for the `Pulsar` class export and `"arbor"` provider identifier to minimize breaking changes for early adopters.

### Added

#### Core Features
- Unified SDK structure consolidating Guard, Risk (Pulsar), Privacy (Arbor), Loom, and FabricCore
- Main `Fabriquant` orchestration class for transaction execution
- `Fabriquant.execute()` - Execute transactions with Guard validation
- `Fabriquant.executePrivate()` - Execute privacy-enabled transactions with ZK Compression

#### Guard (Security Layer)
- Transaction validation with configurable security rules
- Pattern detection for 4 security threats:
  - P-101: Excessive Slippage Detection
  - P-102: Unauthorized Drain Prevention
  - P-103: Malicious CPI Call Detection
  - P-104: Reentrancy Attack Detection
- Configurable enforcement modes: `"block"`, `"warn"`, `"monitor"`
- Risk integration for real-time asset validation
- Custom pattern detection support

#### Risk (formerly Pulsar)
- AI-driven risk assessment for RWA and asset integrity
- Real-time risk scoring and compliance checks
- Intelligent caching with configurable TTL
- Seamless Guard integration for automated transaction blocking
- Fallback handling for API errors

#### Privacy (formerly Arbor - via FabricCore)
- ZK Compression support for massive cost reduction (99.98% savings)
- Transaction optimization with privacy settings
- Cost estimation tools for compression savings
- Shielded state management (placeholder for future integration)
- Support for Light Protocol integration

#### Loom (Liquidity Engine)
- High-velocity liquidity routing (placeholder implementation)
- Transaction weaving with parallel optimization
- Multi-DEX routing preparation

### Changed

#### Breaking Changes
- Project name: `fabricant` → `fabriquant`
- Package name: `@fabricant/sdk` → `@fabriquant/sdk`
- Import paths updated to reflect new package name

#### Backward Compatible Changes
- `Pulsar` class name retained for backward compatibility (represents Risk component)
- `"arbor"` provider identifier retained (represents Privacy component)
- All documentation updated to explain old vs new naming

#### Documentation Updates
- Complete rewrite of README.md with new branding and philosophy
- Created comprehensive GUARD.md documentation
- Created comprehensive RISK.md documentation
- Created comprehensive PRIVACY.md documentation
- Added CONTRIBUTING.md with development guidelines
- Added MIGRATION.md guide for name changes
- Updated all code examples to use new terminology

### Fixed
- ESLint error in `FabricCore.compressWithArbor()` - added explicit Promise.resolve()
- Unused parameter warnings properly suppressed with void operator

### Development

#### Project Structure
```
fabriquant/
├── src/
│   ├── core/           # Fabriquant orchestration class
│   ├── guard/          # Security layer (Guard)
│   ├── pulsar/         # Risk assessment (Risk/Pulsar)
│   ├── fabric/         # Performance & Privacy (FabricCore)
│   ├── loom/           # Liquidity engine (Loom)
│   └── types/          # Shared TypeScript types
├── docs/               # Component documentation
├── examples/           # Usage examples
└── tests/              # Unit tests
```

#### Dependencies
- `@solana/web3.js` ^1.87.6 - Solana blockchain integration
- TypeScript 5.3+ for strict type checking
- Vitest for testing framework
- ESLint for code quality

#### Testing & Quality
- Comprehensive test suite for Guard and pattern detection
- ESLint with TypeScript support and strict rules
- Vitest coverage reporting
- Strict TypeScript configuration

### Roadmap

#### Phase 1: SDK Consolidation ✅
- Merged core modules into unified `@fabriquant/sdk`
- Established consistent naming and branding

#### Phase 1.5: Risk & Privacy Integration ✅
- Risk oracle integration complete
- Privacy layer scaffolding in place

#### Phase 2: Pattern Library (Upcoming)
- Pre-built execution templates for AI agents
- DAO treasury management patterns
- Automated trading strategies

#### Phase 2.5: Full ZK Stack Integration (Upcoming)
- Complete Privacy/Light Protocol integration
- ZK proof generation and verification
- Shielded state management

#### Phase 3: Fabriquant Mainnet (Future)
- Decentralized autonomous vault infrastructure
- Full stack deployment on Solana mainnet

### Migration Guide

For users upgrading from pre-0.1.0 versions, see [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

### Links

- [Repository](https://github.com/fabriquant-labs/fabriquant)
- [Issues](https://github.com/fabriquant-labs/fabriquant/issues)
- [Documentation](./docs/)

### Contributors

- **Psyto** - Project creator and maintainer

---

## [Unreleased]

Future releases will be documented here.

### Planned
- Complete Loom liquidity routing implementation
- Enhanced error handling with custom error types
- Performance benchmarking suite
- API documentation site with TypeDoc
- Additional security patterns (P-105+)
- Integration with actual x402 protocol for Risk
- Full Privacy/Light Protocol ZK stack integration
- TypeScript SDK examples for common use cases
- Chain abstraction layer for cross-chain support
- EVM support for Guard and Risk components

### Business & Operations
- **Business Plan v3.1** (January 2025): Added comprehensive AI tool leverage strategy
  - Updated operating model to emphasize AI-assisted development, marketing, and operations
  - Added AI tool stack recommendations and ROI analysis
  - Updated financial projections to reflect AI tool cost savings
  - Cross-chain strategy documented: "Solana-First, Cross-Chain Enabled"

---

[0.1.0]: https://github.com/fabriquant-labs/fabriquant/releases/tag/v0.1.0
