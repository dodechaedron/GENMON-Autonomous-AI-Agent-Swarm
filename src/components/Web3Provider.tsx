"use client";
import { ReactNode, useState } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const customTheme = darkTheme({
  accentColor: "#00FFFF",
  accentColorForeground: "#0A0A0F",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

customTheme.colors.connectButtonBackground = "rgba(0, 255, 255, 0.08)";
customTheme.colors.connectButtonInnerBackground = "rgba(0, 255, 255, 0.05)";
customTheme.colors.modalBackground = "#0A0A0F";
customTheme.colors.modalBorder = "rgba(191, 0, 255, 0.2)";
customTheme.colors.profileForeground = "#0A0A0F";
customTheme.colors.generalBorder = "rgba(255, 255, 255, 0.1)";

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
