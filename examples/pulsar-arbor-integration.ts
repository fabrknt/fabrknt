/**
 * Pulsar and Arbor Integration Examples
 *
 * This example demonstrates how to use Pulsar (Risk Oracle) and Arbor (Privacy Layer)
 * with Fabricant's Guard and execution system.
 */

import {
  Fabricant,
  Guard,
  Pulsar,
  FabricCore,
  type Transaction,
  type GuardConfig,
} from '@fabricant/sdk';

// Example 1: Using Pulsar for Risk Assessment
async function pulsarRiskAssessment() {
  console.log('=== Example 1: Pulsar Risk Assessment ===\n');

  // Create Guard with Pulsar enabled
  const guard = new Guard({
    pulsar: {
      enabled: true,
      riskThreshold: 0.7, // Block transactions with risk score > 0.7
      enableComplianceCheck: true,
      enableCounterpartyCheck: true,
      enableOracleCheck: true,
      cacheTTL: 60000, // Cache for 1 minute
      fallbackOnError: true, // Allow transactions if Pulsar API fails
    },
    mode: 'block',
    riskTolerance: 'moderate',
  });

  // Create a transaction with asset addresses
  const tx: Transaction = {
    id: 'tx-pulsar-001',
    status: 'pending',
    assetAddresses: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'],
    instructions: [],
  };

  // Validate transaction (Pulsar will check risk metrics)
  const result = await guard.validateTransaction(tx);

  console.log('Transaction Valid:', result.isValid);
  console.log('Warnings:', result.warnings.length);
  result.warnings.forEach((warning) => {
    console.log(`  - [${warning.severity}] ${warning.message}`);
  });

  // Execute with Fabricant
  if (result.isValid) {
    const executed = await Fabricant.execute(tx, { with: guard });
    console.log('Execution Status:', executed.status);
  }
}

// Example 2: Using Pulsar Cache
async function pulsarCacheExample() {
  console.log('\n=== Example 2: Pulsar Cache ===\n');

  // Query risk metrics (will be cached)
  const metrics1 = await Pulsar.getRiskMetrics('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  console.log('First call - Risk Score:', metrics1.riskScore);

  // Query again (will use cache)
  const metrics2 = await Pulsar.getRiskMetrics('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  console.log('Second call (cached) - Risk Score:', metrics2.riskScore);

  // Check cache stats
  const stats = Pulsar.getCacheStats();
  console.log('Cache Size:', stats.size);
  console.log('Cached Assets:', stats.entries);

  // Clear cache
  Pulsar.clearCache();
  console.log('Cache cleared');
}

// Example 3: Batch Risk Assessment
async function batchRiskAssessment() {
  console.log('\n=== Example 3: Batch Risk Assessment ===\n');

  const assetAddresses = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'So11111111111111111111111111111111111111112',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ];

  const riskMetricsMap = await Pulsar.getBatchRiskMetrics(assetAddresses);

  console.log('Batch Risk Assessment Results:');
  for (const [address, metrics] of riskMetricsMap.entries()) {
    console.log(`\nAsset: ${address}`);
    console.log(`  Risk Score: ${metrics.riskScore ?? 'N/A'}`);
    console.log(`  Compliance: ${metrics.complianceStatus ?? 'N/A'}`);
    console.log(`  Counterparty Risk: ${metrics.counterpartyRisk ?? 'N/A'}`);
    console.log(`  Oracle Integrity: ${metrics.oracleIntegrity ?? 'N/A'}`);
  }
}

// Example 4: Private Transaction Execution with Arbor
async function privateTransactionExample() {
  console.log('\n=== Example 4: Private Transaction with Arbor ===\n');

  const guard = new Guard({
    mode: 'block',
    riskTolerance: 'moderate',
  });

  const tx: Transaction = {
    id: 'tx-private-001',
    status: 'pending',
    instructions: [],
    privacyMetadata: {
      requiresPrivacy: true,
      compressionEnabled: true,
    },
  };

  // Execute private transaction
  const result = await Fabricant.executePrivate(tx, {
    with: guard,
    privacy: {
      provider: 'arbor',
      compression: true,
    },
  });

  console.log('Private Transaction Status:', result.status);
  console.log('Privacy Enabled:', result.privacyMetadata?.requiresPrivacy);
  console.log('Compression Enabled:', result.privacyMetadata?.compressionEnabled);
}

// Example 5: Cost Estimation with ZK Compression
function costEstimationExample() {
  console.log('\n=== Example 5: ZK Compression Cost Estimation ===\n');

  const transactionCounts = [100, 1000, 10000, 100000];

  console.log('Cost Comparison: Native vs ZK Compression\n');
  console.log('Transactions | Native Cost (SOL) | Compressed (SOL) | Savings (%)');
  console.log('-------------|-------------------|------------------|------------');

  for (const count of transactionCounts) {
    const estimate = FabricCore.estimateCompressionSavings(count);
    console.log(
      `${count.toString().padStart(12)} | ${estimate.nativeCost.toFixed(6).padStart(17)} | ${estimate.compressedCost.toFixed(6).padStart(16)} | ${estimate.savingsPercent.toFixed(2)}%`
    );
  }
}

// Example 6: Optimized Transaction with Privacy
async function optimizedPrivateTransaction() {
  console.log('\n=== Example 6: Optimized Private Transaction ===\n');

  const tx: Transaction = {
    id: 'tx-optimized-001',
    status: 'pending',
    instructions: [],
  };

  // Optimize with privacy enabled
  const optimized = FabricCore.optimize(tx, {
    enablePrivacy: true,
    compressionLevel: 'high',
    privacyProvider: 'arbor',
  });

  console.log('Original Transaction:', tx.id);
  console.log('Optimized Transaction:', optimized.id);
  console.log('Privacy Enabled:', optimized.privacyMetadata?.requiresPrivacy);
  console.log('Compression Enabled:', optimized.privacyMetadata?.compressionEnabled);

  // Compress with Arbor
  const compressed = await FabricCore.compressWithArbor(optimized, {
    enabled: true,
    compressionLevel: 'high',
    provider: 'arbor',
  });

  console.log('Compressed Transaction:', compressed.id);
}

// Example 7: Combined Pulsar + Arbor Workflow
async function combinedWorkflow() {
  console.log('\n=== Example 7: Combined Pulsar + Arbor Workflow ===\n');

  // Step 1: Create Guard with Pulsar risk assessment
  const guard = new Guard({
    pulsar: {
      enabled: true,
      riskThreshold: 0.6,
      enableComplianceCheck: true,
    },
    mode: 'block',
    riskTolerance: 'strict',
  });

  // Step 2: Create transaction with assets
  const tx: Transaction = {
    id: 'tx-combined-001',
    status: 'pending',
    assetAddresses: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'],
    instructions: [],
  };

  // Step 3: Optimize with privacy
  const optimized = FabricCore.optimize(tx, {
    enablePrivacy: true,
    compressionLevel: 'high',
  });

  // Step 4: Validate with Guard (includes Pulsar check)
  const validation = await guard.validateTransaction(optimized);
  console.log('Validation Result:', validation.isValid);

  if (validation.isValid) {
    // Step 5: Execute as private transaction
    const result = await Fabricant.executePrivate(optimized, {
      with: guard,
      privacy: {
        provider: 'arbor',
        compression: true,
      },
    });

    console.log('Execution Status:', result.status);
    console.log('Privacy Enabled:', result.privacyMetadata?.requiresPrivacy);
  } else {
    console.log('Transaction blocked:', validation.blockedBy);
  }
}

// Run all examples
async function runExamples() {
  try {
    await pulsarRiskAssessment();
    await pulsarCacheExample();
    await batchRiskAssessment();
    await privateTransactionExample();
    costEstimationExample();
    await optimizedPrivateTransaction();
    await combinedWorkflow();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runExamples();

