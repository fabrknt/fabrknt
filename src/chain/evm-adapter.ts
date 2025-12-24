/**
 * EVM Chain Adapter
 *
 * Implements the ChainAdapter interface for EVM-compatible chains
 * (Ethereum, Polygon, Arbitrum, Optimism, Base).
 *
 * Uses viem for blockchain interactions and provides a unified interface
 * for portable components (Guard, Risk, Patterns).
 */

import {
    createPublicClient,
    http,
    type TransactionRequest,
    type Hash,
    isAddress,
    isHex,
} from "viem";
import { mainnet, sepolia, base, baseSepolia, arbitrum, arbitrumSepolia, polygon, polygonAmoy } from "viem/chains";
import type {
    UnifiedTransaction,
    TransactionResult,
    CostEstimate,
    UnifiedOperation,
    ChainId,
    EVMTransactionData,
} from "./types";
import type {
    ChainAdapter,
    ChainAdapterConfig,
} from "./adapter";
import {
    getDefaultEVMNetworkConfig,
    type EVMNetworkConfig,
} from "./evm-networks";
import {
    NetworkError,
    ValidationError,
    ConfigurationError,
} from "./errors";

/**
 * Viem chain configuration mapping
 */
const VIEM_CHAINS = {
    ethereum: {
        mainnet,
        sepolia,
    },
    base: {
        "base-mainnet": base,
        "base-sepolia": baseSepolia,
    },
    arbitrum: {
        "arbitrum-one": arbitrum,
        "arbitrum-sepolia": arbitrumSepolia,
    },
    polygon: {
        "polygon-mainnet": polygon,
        "polygon-amoy": polygonAmoy,
    },
} as const;

/**
 * EVM chain adapter implementation
 *
 * Provides unified interface for EVM-compatible blockchains using viem.
 */
export class EVMAdapter implements ChainAdapter {
    readonly chain: ChainId;
    readonly network: string;
    private client: ReturnType<typeof createPublicClient>;
    private networkConfig: EVMNetworkConfig;
    private rpcUrl?: string;

    constructor(config: ChainAdapterConfig) {
        const evmChains: ChainId[] = ["ethereum", "polygon", "arbitrum", "base"];
        if (!evmChains.includes(config.chain)) {
            throw new ConfigurationError(
                `EVMAdapter requires chain to be one of: ${evmChains.join(", ")}`,
                "chain"
            );
        }

        this.chain = config.chain;
        this.network = config.network || "mainnet";
        this.rpcUrl = config.rpcUrl;

        // Load network configuration
        try {
            this.networkConfig = getDefaultEVMNetworkConfig(this.chain, this.network);
        } catch (error) {
            throw new ConfigurationError(
                error instanceof Error ? error.message : "Failed to load network configuration",
                "network"
            );
        }

        // Initialize viem public client
        this.client = this.createPublicClient() as any;
    }

    /**
     * Create viem public client for RPC interactions
     */
    private createPublicClient() {
        // Get viem chain configuration
        const viemChain = this.getViemChain();

        // Use custom RPC URL if provided, otherwise use network defaults
        const rpcUrl = this.rpcUrl || this.networkConfig.rpcUrls[0];

        return createPublicClient({
            chain: viemChain,
            transport: http(rpcUrl, {
                timeout: 30000, // 30 second timeout
                retryCount: 3,
                retryDelay: 1000,
            }),
        });
    }

    /**
     * Get viem chain configuration
     */
    private getViemChain() {
        const chainConfigs = VIEM_CHAINS[this.chain as keyof typeof VIEM_CHAINS];
        if (!chainConfigs) {
            throw new ConfigurationError(`No viem configuration for chain: ${this.chain}`, "chain");
        }

        const viemChain = (chainConfigs as any)[this.network];
        if (!viemChain) {
            throw new ConfigurationError(
                `No viem configuration for network: ${this.network} on chain: ${this.chain}`,
                "network"
            );
        }

        return viemChain;
    }

    /**
     * Build an EVM transaction from unified transaction
     */
    async buildTransaction(tx: UnifiedTransaction): Promise<TransactionRequest> {
        if (tx.chain !== this.chain) {
            throw new ValidationError(
                `Transaction chain mismatch: expected ${this.chain}, got ${tx.chain}`,
                [`Chain mismatch: expected ${this.chain}, got ${tx.chain}`]
            );
        }

        if (tx.chainData.type !== "evm") {
            throw new ValidationError(
                "Transaction chainData type must be 'evm'",
                ["Invalid chainData type: expected 'evm'"]
            );
        }

        const evmData = tx.chainData.data;

        // Validate chain ID matches
        if (evmData.chainId !== this.networkConfig.chainId) {
            throw new ValidationError(
                `Chain ID mismatch: expected ${this.networkConfig.chainId}, got ${evmData.chainId}`,
                [`Chain ID mismatch`]
            );
        }

        // Build transaction request
        const txRequest: TransactionRequest = {
            to: evmData.to as `0x${string}` | undefined,
            data: evmData.data as `0x${string}`,
            value: evmData.value ? BigInt(evmData.value) : undefined,
        };

        // Add gas parameters (prefer EIP-1559)
        if (evmData.maxFeePerGas && evmData.maxPriorityFeePerGas) {
            txRequest.maxFeePerGas = BigInt(evmData.maxFeePerGas);
            txRequest.maxPriorityFeePerGas = BigInt(evmData.maxPriorityFeePerGas);
        } else if (evmData.gasPrice) {
            txRequest.gasPrice = BigInt(evmData.gasPrice);
        }

        // Add gas limit if provided
        if (evmData.gasLimit) {
            txRequest.gas = BigInt(evmData.gasLimit);
        }

        // Add nonce if provided
        if (evmData.nonce !== undefined) {
            txRequest.nonce = evmData.nonce;
        }

        return txRequest;
    }

    /**
     * Execute an EVM transaction
     *
     * @todo Implement in Phase 3 - requires wallet client for signing
     */
    async executeTransaction(_tx: unknown): Promise<TransactionResult> {
        throw new Error("EVMAdapter.executeTransaction not yet implemented - requires wallet integration (Phase 3)");
    }

    /**
     * Estimate cost for EVM transaction
     *
     * @todo Implement in Phase 3
     */
    async estimateCost(_tx: UnifiedTransaction): Promise<CostEstimate> {
        throw new Error("EVMAdapter.estimateCost not yet implemented - coming in Phase 3");
    }

    /**
     * Validate EVM transaction
     */
    async validateTransaction(tx: UnifiedTransaction): Promise<{
        isValid: boolean;
        errors?: string[];
    }> {
        const errors: string[] = [];

        // Validate chain
        if (tx.chain !== this.chain) {
            errors.push(`Chain mismatch: expected ${this.chain}, got ${tx.chain}`);
        }

        // Validate chainData type
        if (tx.chainData.type !== "evm") {
            errors.push("ChainData type must be 'evm'");
            return { isValid: false, errors };
        }

        const evmData = tx.chainData.data as EVMTransactionData;

        // Validate chain ID
        if (evmData.chainId !== this.networkConfig.chainId) {
            errors.push(`Chain ID mismatch: expected ${this.networkConfig.chainId}, got ${evmData.chainId}`);
        }

        // Validate 'to' address if present
        if (evmData.to && !isAddress(evmData.to)) {
            errors.push(`Invalid 'to' address: ${evmData.to}`);
        }

        // Validate 'data' field
        if (!isHex(evmData.data)) {
            errors.push(`Invalid 'data' field: must be hex string`);
        }

        // Validate value if present
        if (evmData.value !== undefined) {
            try {
                const value = BigInt(evmData.value);
                if (value < 0n) {
                    errors.push("Value must be non-negative");
                }
            } catch {
                errors.push(`Invalid value: ${evmData.value}`);
            }
        }

        // Validate gas limit if present
        if (evmData.gasLimit !== undefined) {
            try {
                const gasLimit = BigInt(evmData.gasLimit);
                if (gasLimit <= 0n) {
                    errors.push("Gas limit must be positive");
                }
            } catch {
                errors.push(`Invalid gas limit: ${evmData.gasLimit}`);
            }
        }

        // Validate gas prices if present
        if (evmData.maxFeePerGas !== undefined) {
            try {
                const maxFee = BigInt(evmData.maxFeePerGas);
                if (maxFee < 0n) {
                    errors.push("Max fee per gas must be non-negative");
                }
            } catch {
                errors.push(`Invalid max fee per gas: ${evmData.maxFeePerGas}`);
            }
        }

        if (evmData.maxPriorityFeePerGas !== undefined) {
            try {
                const priorityFee = BigInt(evmData.maxPriorityFeePerGas);
                if (priorityFee < 0n) {
                    errors.push("Max priority fee per gas must be non-negative");
                }
            } catch {
                errors.push(`Invalid max priority fee per gas: ${evmData.maxPriorityFeePerGas}`);
            }
        }

        if (evmData.gasPrice !== undefined) {
            try {
                const gasPrice = BigInt(evmData.gasPrice);
                if (gasPrice < 0n) {
                    errors.push("Gas price must be non-negative");
                }
            } catch {
                errors.push(`Invalid gas price: ${evmData.gasPrice}`);
            }
        }

        // Validate nonce if present
        if (evmData.nonce !== undefined && evmData.nonce < 0) {
            errors.push("Nonce must be non-negative");
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Get current block number
     */
    async getCurrentBlock(): Promise<number> {
        let lastError: Error | undefined;

        // Retry up to 3 times
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const blockNumber = await this.client.getBlockNumber();
                return Number(blockNumber);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Wait before retrying (exponential backoff)
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        throw new NetworkError(
            `Failed to get current block number after 3 attempts: ${lastError?.message}`,
            this.network,
            this.chain
        );
    }

    /**
     * Get EVM transaction by hash
     */
    async getTransaction(txHash: string): Promise<TransactionResult | null> {
        try {
            // Validate hash format
            if (!isHex(txHash)) {
                throw new ValidationError("Invalid transaction hash format", ["Hash must be hex string"]);
            }

            // Fetch transaction
            const tx = await this.client.getTransaction({
                hash: txHash as Hash,
            });

            if (!tx) {
                return null;
            }

            // Fetch receipt
            let receipt;
            try {
                receipt = await this.client.getTransactionReceipt({
                    hash: txHash as Hash,
                });
            } catch {
                // Transaction might be pending (no receipt yet)
                receipt = null;
            }

            // Map to TransactionResult
            const result: TransactionResult = {
                transactionId: txHash,
                hash: txHash,
                status: receipt ? (receipt.status === "success" ? "success" : "reverted") : "success",
                blockNumber: tx.blockNumber ? Number(tx.blockNumber) : undefined,
                blockHash: tx.blockHash || undefined,
                gasUsed: receipt?.gasUsed,
                receipt,
            };

            return result;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NetworkError(
                `Failed to fetch transaction: ${error instanceof Error ? error.message : String(error)}`,
                this.network,
                this.chain
            );
        }
    }

    /**
     * Parse EVM operations to unified operations
     *
     * Phase 1: Basic implementation - returns generic operations
     * Phase 2 (future): Full ABI decoding with viem's decodeFunctionData
     */
    parseOperations(operations: unknown[]): UnifiedOperation[] {
        return operations.map((op, index) => {
            // For now, return generic operations with raw data
            // TODO: Add EVM transaction data decoding
            // - Use viem's decodeFunctionData() for ABI decoding
            // - Detect common function signatures (ERC20 transfer, approve, etc.)
            // - Parse event logs for operation details
            return {
                type: "custom" as const,
                params: { index, raw: op },
                chainData: op,
            };
        });
    }

    /**
     * Get native currency symbol
     */
    getNativeCurrency(): string {
        return this.networkConfig.nativeCurrency;
    }

    /**
     * Get EVM-specific security patterns
     */
    getSecurityPatterns(): string[] {
        return [
            "EVM-001", // Reentrancy Attack Detection
            "EVM-002", // Flash Loan Attack Detection
            "EVM-003", // Front-running Detection
            "EVM-004", // Unauthorized Access Detection
        ];
    }
}
