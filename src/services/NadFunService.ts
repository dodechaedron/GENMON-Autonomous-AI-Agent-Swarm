/**
 * Nad.fun Integration Service — REAL on-chain integration
 * 
 * Based on official Nad.fun developer docs:
 * https://nad-fun.gitbook.io/nad.fun/for-developers/contracts-and-abi
 * https://github.com/Naddotfun/contract-v3-abi
 */

import { ethers } from "ethers";

// Official Nad.fun contract addresses on Monad Mainnet
export const NAD_FUN_ADDRESSES = {
  BONDING_CURVE_ROUTER: "0x6F6B8F1a20703309951a5127c45B49b1CD981A22",
  BONDING_CURVE: "0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE",
  DEX_ROUTER: "0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137",
  DEX_FACTORY: "0x6B5F564339DbAD6b780249827f2198a841FEB7F3",
  LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea",
  WMON: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A",
} as const;

// Deploy fee: 10 MON on mainnet
const DEPLOY_FEE = ethers.parseEther("10");

// ABIs based on official docs
const BONDING_CURVE_ROUTER_ABI = [
  "function create(tuple(string name, string symbol, string tokenURI, uint256 amountOut, bytes32 salt, uint256 actionId) params) payable returns (address token, address pool)",
  "function buy(tuple(uint256 amountOutMin, address token, address to, uint256 deadline) params) payable",
  "function sell(tuple(uint256 amountIn, uint256 amountOutMin, address token, address to, uint256 deadline) params)",
  "event CurveCreate(address indexed creator, address indexed token, address pool, string name, string symbol, string tokenURI, uint256 virtualMonReserve, uint256 virtualTokenReserve, uint256 targetTokenAmount)",
  "event CurveBuy(address indexed to, address indexed token, uint256 amountIn, uint256 amountOut)",
  "event CurveSell(address indexed to, address indexed token, uint256 amountIn, uint256 amountOut)",
  "event CurveGraduate(address indexed token, address pool)",
];

const LENS_ABI = [
  "function getAmountOut(address token, uint256 amountIn, bool isBuy) view returns (address router, uint256 amountOut)",
  "function getAmountIn(address token, uint256 amountOut, bool isBuy) view returns (address router, uint256 amountIn)",
  "function isGraduated(address token) view returns (bool)",
  "function isLocked(address token) view returns (bool)",
  "function availableBuyTokens(address token) view returns (uint256 availableBuyToken, uint256 requiredMonAmount)",
  "function getProgress(address token) view returns (uint256 progress)",
  "function getInitialBuyAmountOut(uint256 amountIn) view returns (uint256 amountOut)",
];

const DEX_ROUTER_ABI = [
  "function buy(tuple(uint256 amountOutMin, address token, address to, uint256 deadline) params) payable returns (uint256 amountOut)",
  "function sell(tuple(uint256 amountIn, uint256 amountOutMin, address token, address to, uint256 deadline) params) returns (uint256 amountOut)",
];

export interface NadFunTokenParams {
  name: string;
  symbol: string;
  tokenURI: string; // metadata JSON URL
  initialBuyMon?: string; // MON for initial buy (on top of deploy fee)
}

export interface NadFunLaunchResult {
  success: boolean;
  tokenAddress?: string;
  poolAddress?: string;
  txHash?: string;
  nadFunUrl?: string;
  error?: string;
  mode: "onchain" | "simulation";
}

export interface TokenInfo {
  address: string;
  isGraduated: boolean;
  isLocked: boolean;
  progress: number; // 0-10000 basis points
  availableTokens?: string;
  requiredMon?: string;
}

export class NadFunService {
  private signer: ethers.JsonRpcSigner | null;
  private bondingCurveRouter: ethers.Contract | null = null;
  private dexRouter: ethers.Contract | null = null;
  private lens: ethers.Contract | null = null;

  constructor(signer: ethers.JsonRpcSigner | null) {
    this.signer = signer;
    if (signer) {
      this.bondingCurveRouter = new ethers.Contract(
        NAD_FUN_ADDRESSES.BONDING_CURVE_ROUTER, BONDING_CURVE_ROUTER_ABI, signer
      );
      this.dexRouter = new ethers.Contract(
        NAD_FUN_ADDRESSES.DEX_ROUTER, DEX_ROUTER_ABI, signer
      );
      this.lens = new ethers.Contract(
        NAD_FUN_ADDRESSES.LENS, LENS_ABI, signer.provider
      );
    }
  }

  isOnChainAvailable(): boolean {
    return !!this.bondingCurveRouter && !!this.lens && !!this.signer;
  }

  /**
   * Launch a token on Nad.fun via BondingCurveRouter.create()
   * Requires: deploy fee (10 MON) + optional initial buy amount
   */
  async launchToken(params: NadFunTokenParams): Promise<NadFunLaunchResult> {
    if (!this.isOnChainAvailable()) {
      return this.simulateLaunch(params);
    }

    try {
      // Calculate initial buy amount
      const initialBuyMon = params.initialBuyMon
        ? ethers.parseEther(params.initialBuyMon)
        : 0n;

      // Get expected tokens for initial buy (if any)
      let amountOut = 0n;
      if (initialBuyMon > 0n && this.lens) {
        amountOut = await this.lens.getInitialBuyAmountOut(initialBuyMon);
      }

      // Generate random salt
      const salt = ethers.randomBytes(32);

      // Total value = deploy fee + initial buy
      const totalValue = DEPLOY_FEE + initialBuyMon;

      const tx = await this.bondingCurveRouter!.create(
        {
          name: params.name,
          symbol: params.symbol,
          tokenURI: params.tokenURI || "",
          amountOut: amountOut,
          salt: salt,
          actionId: 0,
        },
        { value: totalValue }
      );

      const receipt = await tx.wait();

      // Parse CurveCreate event for token + pool address
      let tokenAddress = "";
      let poolAddress = "";
      for (const log of receipt.logs) {
        try {
          const parsed = this.bondingCurveRouter!.interface.parseLog({
            topics: [...log.topics], data: log.data,
          });
          if (parsed?.name === "CurveCreate") {
            tokenAddress = parsed.args[1]; // token (indexed)
            poolAddress = parsed.args[2]; // pool
            break;
          }
        } catch { continue; }
      }

      return {
        success: true,
        tokenAddress,
        poolAddress,
        txHash: receipt.hash,
        nadFunUrl: tokenAddress ? `https://nad.fun/token/${tokenAddress}` : undefined,
        mode: "onchain",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Launch failed";
      // If on-chain fails, fall back to simulation
      console.error("Nad.fun on-chain launch failed:", message);
      return { success: false, error: message, mode: "onchain" };
    }
  }

  /**
   * Buy tokens on Nad.fun (auto-detects bonding curve vs DEX via Lens)
   */
  async buyToken(tokenAddress: string, monAmount: string, slippageBps: number = 100): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.lens || !this.signer) {
      return { success: false, error: "Not connected" };
    }

    try {
      const amountIn = ethers.parseEther(monAmount);
      const [router, expectedOut] = await this.lens.getAmountOut(tokenAddress, amountIn, true);
      const minOut = (expectedOut * BigInt(10000 - slippageBps)) / 10000n;

      const signerAddress = await this.signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 300;

      const buyParams = {
        amountOutMin: minOut,
        token: tokenAddress,
        to: signerAddress,
        deadline,
      };

      let tx;
      if (router === NAD_FUN_ADDRESSES.BONDING_CURVE_ROUTER) {
        tx = await this.bondingCurveRouter!.buy(buyParams, { value: amountIn });
      } else {
        tx = await this.dexRouter!.buy(buyParams, { value: amountIn });
      }

      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Buy failed" };
    }
  }

  /**
   * Sell tokens on Nad.fun
   */
  async sellToken(tokenAddress: string, tokenAmount: string, slippageBps: number = 100): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.lens || !this.signer) {
      return { success: false, error: "Not connected" };
    }

    try {
      const amountIn = ethers.parseEther(tokenAmount);
      const [router, expectedMon] = await this.lens.getAmountOut(tokenAddress, amountIn, false);
      const minOut = (expectedMon * BigInt(10000 - slippageBps)) / 10000n;

      // Approve router to spend tokens
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function approve(address,uint256) returns (bool)"],
        this.signer
      );
      await (await tokenContract.approve(router, amountIn)).wait();

      const signerAddress = await this.signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 300;

      const sellParams = {
        amountIn,
        amountOutMin: minOut,
        token: tokenAddress,
        to: signerAddress,
        deadline,
      };

      let tx;
      if (router === NAD_FUN_ADDRESSES.BONDING_CURVE_ROUTER) {
        tx = await this.bondingCurveRouter!.sell(sellParams);
      } else {
        tx = await this.dexRouter!.sell(sellParams);
      }

      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Sell failed" };
    }
  }

  /**
   * Get token info via Lens
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    if (!this.lens) return null;

    try {
      const [isGraduated, isLocked, progress] = await Promise.all([
        this.lens.isGraduated(tokenAddress),
        this.lens.isLocked(tokenAddress),
        this.lens.getProgress(tokenAddress),
      ]);

      const info: TokenInfo = {
        address: tokenAddress,
        isGraduated,
        isLocked,
        progress: Number(progress),
      };

      if (!isGraduated) {
        const [available, required] = await this.lens.availableBuyTokens(tokenAddress);
        info.availableTokens = ethers.formatEther(available);
        info.requiredMon = ethers.formatEther(required);
      }

      return info;
    } catch {
      return null;
    }
  }

  /**
   * Get price quote via Lens
   */
  async getQuote(tokenAddress: string, amount: string, isBuy: boolean): Promise<{ router: string; amountOut: string } | null> {
    if (!this.lens) return null;
    try {
      const amountIn = ethers.parseEther(amount);
      const [router, amountOut] = await this.lens.getAmountOut(tokenAddress, amountIn, isBuy);
      return { router, amountOut: ethers.formatEther(amountOut) };
    } catch {
      return null;
    }
  }

  /**
   * Simulated launch for demo/fallback
   */
  private async simulateLaunch(params: NadFunTokenParams): Promise<NadFunLaunchResult> {
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));
    const fakeAddr = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const fakeTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return {
      success: true,
      tokenAddress: fakeAddr,
      txHash: fakeTx,
      nadFunUrl: `https://nad.fun/token/${fakeAddr}`,
      mode: "simulation",
    };
  }
}
