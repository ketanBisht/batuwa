import { useState } from 'react'
import './App.css'
import { generateMnemonic } from "bip39";
import { SolanaWallet } from './sol';
import { EthWallet } from './eth';

function App() {
  const [mnemonic, setMnemonic] = useState("");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-20 px-4 font-sans">
      <div className="w-full max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Batwa
          </h1>
          <p className="text-slate-400 text-lg">
            Your secure, non-custodial HD Wallet
          </p>
        </div>

        {/* Seed Phrase Section */}
        <div className="flex flex-col items-center space-y-6">
          {!mnemonic ? (
            <button
              onClick={async function () {
                const mn = generateMnemonic();
                setMnemonic(mn)
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20"
            >
              Create Seed Phrase
            </button>
          ) : (
            <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4 text-center">Your Secret Phrase</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {mnemonic.split(" ").map((word, index) => (
                  <div key={index} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                    <span className="text-slate-500 text-xs mr-2">{index + 1}.</span>
                    <span className="text-teal-400 font-medium">{word}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigator.clipboard.writeText(mnemonic)}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                  Copy Phrase
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wallets Grid */}
        {mnemonic && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 w-full">
            <SolanaWallet mnemonic={mnemonic} />
            <EthWallet mnemonic={mnemonic} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App