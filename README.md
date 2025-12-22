# 🛠️ Fabricant: The Precision Execution Stack for Solana

**Engineered for Parallelism. Built for Autonomy. Woven for Speed.**

Fabricant is a unified development stack designed to master Solana's Sealevel runtime. We provide the high-performance looms and safety frameworks necessary for AI Agents and DeFi protocols to weave complex transactions with absolute precision.

[Documentation](https://github.com/psyto/fabricant) | [Guard Docs](./docs/GUARD.md) | [Risk Docs](./docs/RISK.md) | [Privacy Docs](./docs/PRIVACY.md) | [X (Twitter)](https://x.com/psyto)

---

## 🧵 The Philosophy: "Weaving the Transaction Layer"

In a parallel world, transactions are no longer a linear chain—they are a complex fabric. **Fabricant** provides the tools to design, optimize, and secure this fabric, ensuring that every thread (transaction) is executed with maximum efficiency and zero conflict.

## 📦 The Fabricant Suite

### 1. 🧵 Loom (Core: `solfabric`)

**The Advanced Loom.**
A framework that structures state management and transaction bundling to eliminate lock contention.

-   **Parallel Optimization:** Maximizes throughput using custom data structures.
-   **Compute Efficiency:** Minimizes CU usage through optimized instruction routing.

### 2. 🛡️ Guard (Core: `sol-ops-guard`)

**The Quality Control.**
An on-chain safety layer that ensures the integrity of every woven transaction.

-   **Execution Constraints:** Hardened boundaries for autonomous agent operations.
-   **Anti-Drain Logic:** Real-time monitoring to prevent unauthorized capital flight.

### 3. ⚡ Flow (Core: `x-liquidity-engine`)

**The Silk Path.**
A high-velocity liquidity engine that finds the smoothest path for asset movement across the ecosystem.

-   Integrated multi-DEX routing for automated rebalancing.
-   Low-latency execution for high-frequency strategies.

### 4. 🧭 Risk (Core: `pulsar`)

**The Quality Gauge.**
An AI-driven risk assessment gateway providing institutional-grade metrics for asset integrity and RWA validation.

-   **Real-time Risk Assessment:** Continuous monitoring of risk scores, compliance status, and oracle integrity.
-   **Intelligent Caching:** Configurable TTL to maximize performance and minimize API overhead.
-   **Guard Integration:** Seamlessly feeds data into Guard for automated transaction blocking.

### 5. 🌿 Privacy (Core: `arbor`)

**The Hidden Stitch.**
A privacy and scaling layer utilizing ZK Compression for shielded, cost-efficient transaction execution.

-   **ZK Compression:** Massive cost reduction for state storage and account creation via Sparse Binary Merkle Trees.
-   **Privacy by Default:** Shielded state management to ensure transaction confidentiality.
-   **Efficient Execution:** Dedicated API designed for privacy-enabled operations without sacrificing speed.

---

## 🛠️ Developer Preview: Weaving a Secure Transaction

### Basic Transaction with Guard

```typescript
import { Fabricant, Guard, Loom } from "@fabricant/sdk";

// 1. Initialize the Precision Guard
const guard = new Guard({
    maxSlippage: 0.1,
    riskTolerance: "moderate",
    mode: "block",
});

// 2. Weave an optimized parallel transaction
const tx = await Loom.weave({
    type: "MULTI_ROUTE_SWAP",
    input: "SOL",
    output: "USDC",
    amount: 50,
    parallelPriority: true, // Enabled by Loom
});

// 3. Execute with Fabricant Precision
await Fabricant.execute(tx, { with: guard });
```

### Transaction with Risk Assessment

```typescript
import { Fabricant, Guard, Pulsar } from "@fabricant/sdk";

// Guard with Risk assessment enabled
const guard = new Guard({
    pulsar: {
        // Risk configuration (class still named Pulsar for backward compatibility)
        enabled: true,
        riskThreshold: 0.7, // Block transactions with risk > 0.7
        enableComplianceCheck: true,
        enableCounterpartyCheck: true,
        cacheTTL: 60000, // Cache for 1 minute
        fallbackOnError: true,
    },
    mode: "block",
});

// Transaction with asset addresses for risk assessment
const tx = {
    id: "tx-001",
    status: "pending",
    assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
    instructions: [],
};

// Risk automatically checks risk metrics during validation
const result = await guard.validateTransaction(tx);
if (result.isValid) {
    await Fabricant.execute(tx, { with: guard });
}
```

### Private Transaction with Privacy

```typescript
import { Fabricant, Guard, FabricCore } from "@fabricant/sdk";

const guard = new Guard({ riskTolerance: "moderate" });

// Optimize transaction with privacy enabled
const tx = FabricCore.optimize(transaction, {
    enablePrivacy: true,
    compressionLevel: "high",
    privacyProvider: "arbor", // Privacy (provider identifier unchanged for backward compatibility)
});

// Execute as private transaction with ZK Compression
const result = await Fabricant.executePrivate(tx, {
    with: guard,
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});

// Estimate cost savings
const savings = FabricCore.estimateCompressionSavings(1000);
console.log(`Savings: ${savings.savingsPercent.toFixed(2)}%`);
```

> **Note:** The SDK is currently in active development. Core functionality is being integrated from standalone repositories.

---

## 🗺️ Roadmap: 2025-2026

-   **Phase 1: The Loom (SDK Consolidation)** ✅ - Merging core modules into `@fabricant/sdk`.
-   **Phase 1.5: Risk & Privacy Integration** ✅ - Risk oracle and Privacy layer integrated.
-   **Phase 2: Pattern Library** - Pre-built execution templates for AI Trading Agents and DAO Treasury Management.
-   **Phase 2.5: Full ZK Stack Integration** - Complete Privacy/Light Protocol integration with proof generation.
-   **Phase 3: The Fabricant Mainnet** - A decentralized autonomous vault infrastructure leveraging the full stack.

---

## 🤝 Join the Atelier

Fabricant is an open-source initiative for the Solana builder community.

-   **Builders:** Star our repos and contribute to the parallel execution revolution.
-   **Projects:** Contact us for integration support for AI Agents and DeFi infrastructure.

---

## 🛠️ Core Repositories

-   [x-liquidity-engine](https://github.com/psyto/x-liquidity-engine) - The Liquidity Backbone
-   [sol-ops-guard](https://github.com/psyto/sol-ops-guard) - Security & Compliance
-   [solfabric](https://github.com/psyto/solfabric) - Parallel Execution Logic
-   [pulsar](https://github.com/psyto/pulsar) - Risk: RWA Risk Oracle & Integrity Gateway
-   [arbor](https://github.com/psyto/arbor) - Privacy: Shielded State Middleware & Privacy Layer

---

**Fabricant: Weaving the Future of Autonomous Finance.**
Built with ❤️ by **psyto** | Powered by **Solana**
