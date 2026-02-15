/**
 * OnChainAnalyzer — Real on-chain data via Monad RPC
 *
 * Queries the chain directly for:
 * - Block activity (tx count, gas usage)
 * - Token transfer volume (ERC-20 Transfer events)
 * - Holder count estimation (unique Transfer recipients)
 * - Network health metrics
 *
 * No API key needed — uses public RPC endpoints.
 */

export interface TokenOnChainData {
  address: string;
  transferCount: number;
  uniqueHolders: number;
  totalVolume: string; // raw wei string
  avgTransferSize: string;
  lastActivityBlock: number;
  activityScore: number; // 0-100
}

export interface NetworkActivity {
  blockNumber: number;
  txCount: number;
  gasUsed: string;
  gasUtilization: number; // 0-100%
  timestamp: number;
  avgGasPrice: string;
}

export interface OnChainSentiment {
  topic: string;
  score: number;
  volume: number;
  trending: boolean;
  keywords: string[];
  source: "onchain";
  data?: {
    tokenData?: TokenOnChainData;
    networkActivity?: NetworkActivity;
  };
}

// ERC-20 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// RPC endpoints
const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
const MONAD_MAINNET_RPC = "https://rpc.monad.xyz";

// Cache
const cache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  return null;
}
function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export class OnChainAnalyzer {
  private rpcUrl: string;

  constructor(useMainnet: boolean = false) {
    this.rpcUrl = useMainnet ? MONAD_MAINNET_RPC : MONAD_TESTNET_RPC;
  }

  /** Low-level JSON-RPC call */
  private async rpc(method: string, params: unknown[] = []): Promise<unknown> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`RPC ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return json.result;
  }

  /** Get current block number */
  async getBlockNumber(): Promise<number> {
    const hex = (await this.rpc("eth_blockNumber")) as string;
    return parseInt(hex, 16);
  }

  /** Get block with transaction details */
  async getBlock(blockNumberOrTag: string | number = "latest"): Promise<Record<string, unknown>> {
    const param = typeof blockNumberOrTag === "number"
      ? "0x" + blockNumberOrTag.toString(16)
      : blockNumberOrTag;
    return (await this.rpc("eth_getBlockByNumber", [param, false])) as Record<string, unknown>;
  }

  /**
   * Get network activity for recent blocks
   */
  async getNetworkActivity(blockCount: number = 5): Promise<NetworkActivity> {
    const cacheKey = `net_activity_${blockCount}`;
    const cached = getCached<NetworkActivity>(cacheKey);
    if (cached) return cached;

    try {
      const currentBlock = await this.getBlockNumber();
      let totalTx = 0;
      let totalGasUsed = BigInt(0);
      let totalGasLimit = BigInt(0);
      let latestTimestamp = 0;
      let gasPriceSum = BigInt(0);
      let gasPriceCount = 0;

      const blockPromises = [];
      for (let i = 0; i < blockCount; i++) {
        blockPromises.push(this.getBlock(currentBlock - i));
      }
      const blocks = await Promise.all(blockPromises);

      for (const block of blocks) {
        if (!block) continue;
        const txs = (block.transactions as string[]) || [];
        totalTx += txs.length;
        totalGasUsed += BigInt((block.gasUsed as string) || "0x0");
        totalGasLimit += BigInt((block.gasLimit as string) || "0x1");
        const ts = parseInt((block.timestamp as string) || "0x0", 16);
        if (ts > latestTimestamp) latestTimestamp = ts;
        if (block.baseFeePerGas) {
          gasPriceSum += BigInt(block.baseFeePerGas as string);
          gasPriceCount++;
        }
      }

      const gasUtilization = totalGasLimit > 0n
        ? Number((totalGasUsed * 100n) / totalGasLimit)
        : 0;

      const avgGasPrice = gasPriceCount > 0
        ? (gasPriceSum / BigInt(gasPriceCount)).toString()
        : "0";

      const result: NetworkActivity = {
        blockNumber: currentBlock,
        txCount: totalTx,
        gasUsed: totalGasUsed.toString(),
        gasUtilization: Math.min(100, gasUtilization),
        timestamp: latestTimestamp,
        avgGasPrice,
      };

      setCache(cacheKey, result, 30_000); // 30s cache
      return result;
    } catch (err) {
      /* silent: RPC may be unavailable */
      return {
        blockNumber: 0, txCount: 0, gasUsed: "0",
        gasUtilization: 0, timestamp: 0, avgGasPrice: "0",
      };
    }
  }

  /**
   * Analyze a token's on-chain activity via Transfer event logs
   * Looks at recent blocks for transfer count, unique holders, volume
   */
  async analyzeToken(tokenAddress: string, blockRange: number = 500): Promise<TokenOnChainData> {
    const cacheKey = `token_${tokenAddress}_${blockRange}`;
    const cached = getCached<TokenOnChainData>(cacheKey);
    if (cached) return cached;

    try {
      const currentBlock = await this.getBlockNumber();
      const fromBlock = "0x" + Math.max(0, currentBlock - blockRange).toString(16);
      const toBlock = "0x" + currentBlock.toString(16);

      // Fetch ERC-20 Transfer logs for this token
      const logs = (await this.rpc("eth_getLogs", [{
        address: tokenAddress,
        topics: [TRANSFER_TOPIC],
        fromBlock,
        toBlock,
      }])) as Array<{ topics: string[]; data: string; blockNumber: string }>;

      const uniqueRecipients = new Set<string>();
      let totalVolume = BigInt(0);
      let lastBlock = 0;

      for (const log of logs) {
        // topics[2] = to address (padded to 32 bytes)
        if (log.topics[2]) {
          uniqueRecipients.add("0x" + log.topics[2].slice(26));
        }
        totalVolume += BigInt(log.data || "0x0");
        const bn = parseInt(log.blockNumber, 16);
        if (bn > lastBlock) lastBlock = bn;
      }

      const transferCount = logs.length;
      const avgSize = transferCount > 0
        ? (totalVolume / BigInt(transferCount)).toString()
        : "0";

      // Activity score: based on transfer frequency and holder diversity
      const txScore = Math.min(40, transferCount * 2); // max 40 from tx count
      const holderScore = Math.min(40, uniqueRecipients.size * 4); // max 40 from holders
      const recencyScore = lastBlock >= currentBlock - 50 ? 20 : lastBlock >= currentBlock - 200 ? 10 : 0;
      const activityScore = Math.min(100, txScore + holderScore + recencyScore);

      const result: TokenOnChainData = {
        address: tokenAddress,
        transferCount,
        uniqueHolders: uniqueRecipients.size,
        totalVolume: totalVolume.toString(),
        avgTransferSize: avgSize,
        lastActivityBlock: lastBlock,
        activityScore,
      };

      setCache(cacheKey, result, 60_000); // 1 min cache
      return result;
    } catch (err) {
      /* silent: token analysis may fail */
      return {
        address: tokenAddress, transferCount: 0, uniqueHolders: 0,
        totalVolume: "0", avgTransferSize: "0", lastActivityBlock: 0, activityScore: 0,
      };
    }
  }

  /**
   * Get on-chain sentiment for the network — used by agents
   * Combines network activity metrics into a sentiment signal
   */
  async getOnChainSentiment(): Promise<OnChainSentiment> {
    const cacheKey = "onchain_sentiment";
    const cached = getCached<OnChainSentiment>(cacheKey);
    if (cached) return cached;

    try {
      const activity = await this.getNetworkActivity(10);

      // Score based on network health
      const txPerBlock = activity.txCount / 10;
      const txScore = Math.min(40, txPerBlock * 0.5);
      const gasScore = Math.min(30, activity.gasUtilization * 0.3);
      const freshnessScore = activity.timestamp > 0 ? 20 : 0;
      const score = Math.min(100, Math.round(txScore + gasScore + freshnessScore + 10));

      const trending = txPerBlock > 20 && activity.gasUtilization > 30;

      const result: OnChainSentiment = {
        topic: `Monad Network (${txPerBlock.toFixed(0)} tx/block)`,
        score,
        volume: activity.txCount,
        trending,
        keywords: ["monad", "onchain", "network", "activity", "gas"],
        source: "onchain",
        data: { networkActivity: activity },
      };

      setCache(cacheKey, result, 30_000);
      return result;
    } catch (err) {
      /* silent: on-chain sentiment may fail */
      return {
        topic: "Monad Network",
        score: 30,
        volume: 0,
        trending: false,
        keywords: ["monad", "onchain"],
        source: "onchain",
      };
    }
  }

  /**
   * Analyze multiple token addresses and return ranked results
   */
  async analyzeTokens(addresses: string[]): Promise<TokenOnChainData[]> {
    const results = await Promise.all(
      addresses.slice(0, 10).map((addr) => this.analyzeToken(addr))
    );
    return results
      .filter((r) => r.transferCount > 0)
      .sort((a, b) => b.activityScore - a.activityScore);
  }
}
