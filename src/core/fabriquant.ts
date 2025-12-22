/**
 * Core Fabriquant class for executing protected transactions with precision
 */

import type { FabriquantConfig, Transaction } from "../types";
import type { Guard } from "../guard";
import { Pulsar } from "../pulsar";

export class Fabriquant {
    private config: FabriquantConfig;

    constructor(config: FabriquantConfig = {}) {
        this.config = {
            network: config.network || "mainnet-beta",
            rpcUrl: config.rpcUrl,
            privacy: config.privacy,
        };
    }

    /**
     * Execute a transaction with Guard protection and optional Risk assessment
     */
    public static async execute(
        tx: Transaction,
        options: { with?: Guard } = {}
    ): Promise<Transaction> {
        // Validate with guard if provided
        if (options.with) {
            const isValid = await options.with.validate(tx);
            if (!isValid) {
                return { ...tx, status: "failed" };
            }

            // Additional validation: Check Risk if Guard has Pulsar config
            const guardConfig = options.with.getConfig();
            if (guardConfig.pulsar?.enabled && tx.assetAddresses) {
                try {
                    const riskMetricsMap = await Pulsar.getBatchRiskMetrics(
                        tx.assetAddresses,
                        guardConfig.pulsar
                    );

                    // Check if any asset exceeds risk threshold
                    for (const [, metrics] of riskMetricsMap.entries()) {
                        if (
                            metrics.riskScore !== null &&
                            guardConfig.pulsar.riskThreshold !== undefined &&
                            metrics.riskScore > guardConfig.pulsar.riskThreshold
                        ) {
                            // Block transaction if risk is too high and mode is 'block'
                            if (guardConfig.mode === "block") {
                                return {
                                    ...tx,
                                    status: "failed",
                                };
                            }
                        }

                        // Block non-compliant assets if compliance check is enabled
                        if (
                            guardConfig.pulsar.enableComplianceCheck &&
                            metrics.complianceStatus === "non-compliant" &&
                            guardConfig.mode === "block"
                        ) {
                            return {
                                ...tx,
                                status: "failed",
                            };
                        }
                    }
                } catch (error) {
                    // If Risk fails and fallback is enabled, continue execution
                    if (!guardConfig.pulsar.fallbackOnError) {
                        return { ...tx, status: "failed" };
                    }
                }
            }
        }

        // Placeholder execution logic
        // TODO: Integrate with actual Solana transaction execution
        return { ...tx, status: "executed" };
    }

    /**
     * Execute a private transaction with Privacy layer
     */
    public static async executePrivate(
        tx: Transaction,
        options: {
            with?: Guard;
            privacy?: { provider?: "arbor" | "light"; compression?: boolean };
        } = {}
    ): Promise<Transaction> {
        // Mark transaction as requiring privacy
        const privateTx: Transaction = {
            ...tx,
            privacyMetadata: {
                requiresPrivacy: true,
                compressionEnabled: options.privacy?.compression ?? true,
            },
        };

        // Validate with guard if provided
        if (options.with) {
            const isValid = await options.with.validate(privateTx);
            if (!isValid) {
                return { ...privateTx, status: "failed" };
            }
        }

        // TODO: Integrate with Privacy/Light Protocol ZK Stack
        // This would:
        // 1. Compress transaction state using Sparse Binary Merkle Trees
        // 2. Generate ZK proof
        // 3. Submit compressed transaction to Solana

        // Placeholder: For now, execute normally but mark as private
        return { ...privateTx, status: "executed" };
    }

    public getConfig(): FabriquantConfig {
        return this.config;
    }
}
