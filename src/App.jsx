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
  const [activeWallet, setActiveWallet] = useState('solana');

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

  const openSidePanel = async () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.windows) {
      try {
        const windowInfo = await chrome.windows.getCurrent();
        await chrome.sidePanel.open({ windowId: windowInfo.id });
      } catch (e) {
        console.error("Failed to open side panel:", e);
      }
    } else {
      alert("Side Panel feature is only available in Chrome Extension environment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:py-10 md:px-4 font-sans">
      <div className="w-full max-w-none md:max-w-6xl space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg sticky top-0 z-50 md:static">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Batuwa
            </h1>
          </div>
          <div className="flex items-center gap-1 md:gap-4">
            <button
              onClick={openSidePanel}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500 flex items-center justify-center"
              title="Open in Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h8.25a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25H9m-3-18v18m3-18H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21H6m3-18v18" />
              </svg>
              <span className="hidden md:inline">Sidebar</span>
            </button>
            <button
              onClick={openPopup}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500 flex items-center justify-center"
              title="Open in Popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span className="hidden md:inline">Popup</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500 whitespace-nowrap"
            >
              Lock Wallet
            </button>
          </div>
        </div>

        {/* Wallets Switcher */}
        <div className="flex bg-slate-800/80 backdrop-blur-md rounded-xl p-1 shadow-inner border border-slate-700/50 max-w-sm mx-auto w-full mb-6">
          <button
            onClick={() => setActiveWallet('solana')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${activeWallet === 'solana' ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M125.767 61.3411L82.1643 14.281C81.9961 14.12 81.7961 14.0321 81.564 14.0321H48.0177C47.3821 14.0321 47.11 14.8687 47.6083 15.2505L91.2109 62.3106C91.3791 62.4717 91.5791 62.5595 91.8113 62.5595H125.357C125.993 62.5595 126.265 61.7229 125.767 61.3411Z" fill="url(#paint0_linear)" />
              <path d="M2.23306 66.6589L45.8357 113.719C46.0039 113.88 46.2039 113.968 46.436 113.968H79.9823C80.6179 113.968 80.89 113.131 80.3917 112.75L36.7891 65.6894C36.6209 65.5283 36.4209 65.4405 36.1887 65.4405H2.64257C2.00701 65.4405 1.73499 66.2771 2.23306 66.6589Z" fill="url(#paint1_linear)" />
              <path d="M2.23306 61.3411L45.8357 14.281C46.0039 14.12 46.2039 14.0321 46.436 14.0321H79.9823C80.6179 14.0321 80.89 14.8687 80.3917 15.2505L36.7891 62.3106C36.6209 62.4717 36.4209 62.5595 36.1887 62.5595H2.64257C2.00701 62.5595 1.73499 61.7229 2.23306 61.3411Z" fill="url(#paint2_linear)" />
              <defs>
                <linearGradient id="paint0_linear" x1="58.2104" y1="14.0321" x2="115.163" y2="62.5595" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="12.8357" y1="65.4405" x2="69.7885" y2="113.968" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient id="paint2_linear" x1="12.8357" y1="14.0321" x2="69.7885" y2="62.5595" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
              </defs>
            </svg>
            Solana
          </button>
          <button
            onClick={() => setActiveWallet('ethereum')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${activeWallet === 'ethereum' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.22l7.365 4.339 7.365-4.34L12.056 0z" />
            </svg>
            Ethereum
          </button>
        </div>

        {/* Wallets Display */}
        <div className="w-full px-0 pb-4 md:pb-0">
          {activeWallet === 'solana' ? (
            <SolanaWallet mnemonic={mnemonic} />
          ) : (
            <EthWallet mnemonic={mnemonic} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App