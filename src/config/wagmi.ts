import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { cookieStorage, createStorage } from "wagmi";

// Monad Testnet
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

// Monad Mainnet
export const monadMainnet = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://monadscan.com" },
  },
});

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_PROJECT_ID";

// Both chains available — user switches via UI
export const wagmiConfig = getDefaultConfig({
  appName: "GENMON",
  projectId: WC_PROJECT_ID,
  chains: [monadTestnet, monadMainnet],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

export const TESTNET_CHAIN_ID = monadTestnet.id;
export const MAINNET_CHAIN_ID = monadMainnet.id;
