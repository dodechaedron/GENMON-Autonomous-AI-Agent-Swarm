"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const },
            })}
            className="flex items-center gap-1.5"
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan/20 to-purple/20 border border-cyan/40 text-cyan text-xs sm:text-sm hover:from-cyan/30 hover:to-purple/30 transition-all active:scale-95"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="px-3 py-1.5 rounded-lg border border-yellow-500/50 text-yellow-400 text-xs hover:bg-yellow-500/10 transition-all"
                  >
                    Wrong Network
                  </button>
                );
              }

              const isTestnet = chain.id === 10143;

              return (
                <div className="flex items-center gap-1.5">
                  {/* Network switch button */}
                  <button
                    onClick={openChainModal}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all hover:opacity-80 active:scale-95 ${
                      isTestnet
                        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                        : "border-green-500/30 bg-green-500/10 text-green-400"
                    }`}
                    title="Click to switch network"
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isTestnet ? "bg-yellow-400" : "bg-green-400"}`} />
                    {isTestnet ? "Testnet" : "Mainnet"}
                  </button>

                  {/* Balance */}
                  <span className="text-[10px] text-gray-500 hidden sm:inline">
                    {account.balanceFormatted
                      ? `${parseFloat(account.balanceFormatted).toFixed(3)} ${account.balanceSymbol}`
                      : ""}
                  </span>

                  {/* Account */}
                  <button
                    onClick={openAccountModal}
                    className="px-3 py-1.5 rounded-lg border border-cyan/30 bg-cyan/5 text-cyan text-xs hover:bg-cyan/10 transition-all"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
