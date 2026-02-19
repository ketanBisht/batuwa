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

  const openPopup = () => {
    window.open(window.location.href, 'batuwa_popup', 'width=360,height=600,resizable=no,scrollbars=no,status=no,toolbar=no,menubar=no,location=no');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-0 md:py-10 md:px-4 font-sans">
      <div className="w-full max-w-none md:max-w-6xl space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-4 md:p-6 rounded-none md:rounded-2xl shadow-lg sticky top-0 z-50 md:static">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Batuwa
            </h1>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={openPopup}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500 hidden md:block"
              title="Open in Popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span className="hidden md:inline">Open Popup</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500"
            >
              Lock Wallet
            </button>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-10 w-full px-4 md:px-0 pb-4 md:pb-0">
          <SolanaWallet mnemonic={mnemonic} />
          <EthWallet mnemonic={mnemonic} />
        </div>
      </div>
    </div>
  )
}

export default App