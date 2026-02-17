import { useState, useEffect } from 'react'
import './App.css'
import { SolanaWallet } from './sol';
import { EthWallet } from './eth';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';

function App() {
  const [mnemonic, setMnemonic] = useState(null);
  const [hasEncryptedWallet, setHasEncryptedWallet] = useState(false);

  useEffect(() => {
    // Check if wallet exists in storage
    const encrypted = localStorage.getItem('encrypted_mnemonic');
    if (encrypted) {
      setHasEncryptedWallet(true);
    }
  }, []);

  const handleLogout = () => {
    setMnemonic(null);
  };

  const handleClearWallet = () => {
    if (confirm("Are you sure? This will delete your wallet permanently.")) {
      localStorage.removeItem('encrypted_mnemonic');
      localStorage.removeItem('wallet_metadata');
      setHasEncryptedWallet(false);
      setMnemonic(null);
    }
  };

  if (!hasEncryptedWallet) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-20 px-4 font-sans">
        <Onboarding onComplete={(mn) => {
          setMnemonic(mn);
          setHasEncryptedWallet(true);
        }} />
      </div>
    );
  }

  if (!mnemonic) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-20 px-4 font-sans">
        <Login onLogin={(mn) => setMnemonic(mn)} />
        <button onClick={handleClearWallet} className="mt-8 text-red-500 text-xs hover:text-red-400 underline opacity-50 hover:opacity-100 transition-opacity">
          Reset Wallet (Clears Data)
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Batwa
            </h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500"
            >
              Lock Wallet
            </button>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 w-full">
          <SolanaWallet mnemonic={mnemonic} />
          <EthWallet mnemonic={mnemonic} />
        </div>
      </div>
    </div>
  )
}

export default App