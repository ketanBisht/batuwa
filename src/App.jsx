import { useState, useEffect } from 'react'
import './App.css'
import { SolanaWallet } from './sol';
import { EthWallet } from './eth';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { ConfirmationModal } from './components/ConfirmationModal';

function App() {
  const [mnemonic, setMnemonic] = useState(null);
  const [hasEncryptedWallet, setHasEncryptedWallet] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

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
    localStorage.removeItem('encrypted_mnemonic');
    localStorage.removeItem('wallet_metadata');
    localStorage.removeItem('solana_wallets');
    localStorage.removeItem('eth_wallets');
    setHasEncryptedWallet(false);
    setMnemonic(null);
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
        <button onClick={() => setShowResetModal(true)} className="mt-8 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors">
          Reset Wallet
        </button>

        <ConfirmationModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleClearWallet}
          title="Reset Wallet?"
          message="Are you sure you want to reset your wallet? This will permanently delete your current wallet and all associated data from this browser. This action cannot be undone."
          confirmText="Yes, Reset Wallet"
          type="danger"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Batuwa
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