import { useState, useEffect } from "react";
import { mnemonicToSeedSync } from "bip39";
import { Wallet, HDNodeWallet, JsonRpcProvider, formatEther, parseEther } from "ethers";
import { WalletActionModal } from "./components/WalletActionModal";
import { DeleteWalletModal } from "./components/DeleteWalletModal";
import { PasswordPromptModal } from "./components/PasswordPromptModal";
import { PrivateKeyModal } from "./components/PrivateKeyModal";
import { Notification } from "./components/Notification";
import { encryptData, decryptData } from "./utils/crypto";
import { ETH_RPC_URL } from "./config";

// Simplified connection to Sepolia
const provider = new JsonRpcProvider(ETH_RPC_URL);

export const EthWallet = ({ mnemonic }) => {
    const [addresses, setAddresses] = useState([]);
    const [modalConfig, setModalConfig] = useState(null);
    const [deleteConfig, setDeleteConfig] = useState(null); // { isOpen, address, type, hasFunds }

    // Security / Keys
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [passwordAction, setPasswordAction] = useState(null); // 'view_key' | 'import'
    const [targetWallet, setTargetWallet] = useState(null);
    const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(null); // { secretKey }
    const [showImportInput, setShowImportInput] = useState(false);
    const [importKeyInput, setImportKeyInput] = useState('');

    useEffect(() => {
        const storedWallets = JSON.parse(localStorage.getItem('eth_wallets') || '[]');
        setAddresses(storedWallets);
    }, []);

    useEffect(() => {
        if (addresses.length > 0) {
            localStorage.setItem('eth_wallets', JSON.stringify(addresses));
        }
    }, [addresses]);

    const [notification, setNotification] = useState(null); // { message, type }

    const addWallet = async () => {
        const seed = await mnemonicToSeedSync(mnemonic);

        // Get the next index from storage or initialize
        let nextIndex = parseInt(localStorage.getItem('nextEthIndex') || '0');
        let index = nextIndex;
        let address = '';
        let balance = 0;

        while (true) {
            const path = `m/44'/60'/0'/0/${index}`;
            const hdNode = HDNodeWallet.fromSeed(seed);
            const wallet = hdNode.derivePath(path);
            address = wallet.address;

            const exists = addresses.some(w => w.address === address);
            if (!exists) {
                try {
                    balance = await fetchBalance(address);
                } catch (e) {
                    console.error(e);
                }
                break;
            }
            index++;
        }

        // Save the NEXT index
        localStorage.setItem('nextEthIndex', (index + 1).toString());

        setAddresses([...addresses, {
            address,
            balance: balance,
            type: 'hd',
            index: index
        }]);
    };

    const handleImportWallet = async () => {
        try {
            let input = importKeyInput.trim();
            if (!input.startsWith('0x')) {
                input = '0x' + input;
            }
            // Validate key before asking for password
            new Wallet(input);
            
            setPasswordAction('import');
            setShowPasswordPrompt(true);
        } catch (e) {
            setNotification({ message: "Invalid Private Key. Please ensure it is a valid hex string.", type: "error" });
        }
    };

    const handleDelete = (address) => {
        const wallet = addresses.find(w => w.address === address);
        if (!wallet) return;

        setDeleteConfig({
            isOpen: true,
            address,
            type: wallet.type,
            hasFunds: parseFloat(wallet.balance) > 0
        });
    };

    const confirmDelete = () => {
        if (deleteConfig?.address) {
            setAddresses(addresses.filter(w => w.address !== deleteConfig.address));
            setDeleteConfig(null);
        }
    };

    const initiateViewKey = (wallet) => {
        setTargetWallet(wallet);
        setPasswordAction('view_key');
        setShowPasswordPrompt(true);
    };

    const handlePasswordSuccess = async (decryptedMnemonic, password) => {
        setShowPasswordPrompt(false);
        if (passwordAction === 'import') {
            try {
                let input = importKeyInput.trim();
                if (!input.startsWith('0x')) {
                    input = '0x' + input;
                }
                const wallet = new Wallet(input);
                const address = wallet.address;

                const exists = addresses.some(w => w.address === address);
                if (exists) {
                    setNotification({ message: "Wallet already exists!", type: "error" });
                    return;
                }

                const balance = await fetchBalance(address);
                const encryptedKey = encryptData(input, password);

                setAddresses([...addresses, {
                    address,
                    balance: balance,
                    type: 'imported',
                    privateKey: encryptedKey
                }]);
                setImportKeyInput('');
                setShowImportInput(false);
                setNotification({ message: "Wallet imported successfully!", type: "success" });
            } catch (e) {
                setNotification({ message: "Import failed during encryption.", type: "error" });
            }
        } else if (passwordAction === 'view_key' && targetWallet) {
            let secretKeyString = '';

            if (targetWallet.type === 'imported') {
                secretKeyString = decryptData(targetWallet.privateKey, password);
            } else {
                // Re-derive
                const seed = await mnemonicToSeedSync(decryptedMnemonic);

                const path = `m/44'/60'/0'/0/${targetWallet.index}`;
                const hdNode = HDNodeWallet.fromSeed(seed);
                const child = hdNode.derivePath(path);
                secretKeyString = child.privateKey;
            }

            setShowPrivateKeyModal({ secretKey: secretKeyString });
            setTargetWallet(null);
        } else if (passwordAction === 'send' && pendingTx) {
            try {
                const hash = await executeSend(decryptedMnemonic, password);
                if (pendingTx.resolve) pendingTx.resolve(hash);
            } catch (error) {
                if (pendingTx.reject) pendingTx.reject(error);
            }
        }
    };

    const fetchBalance = async (address) => {
        try {
            const balance = await provider.getBalance(address);
            return formatEther(balance);
        } catch (e) {
            console.error("Failed to fetch balance:", e);
            return "0.0";
        }
    };

    const refreshBalances = async () => {
        const updatedWallets = await Promise.all(addresses.map(async (wallet) => {
            const balance = await fetchBalance(wallet.address);
            return { ...wallet, balance };
        }));
        setAddresses(updatedWallets);
    };

    const executeSend = async (decryptedMnemonic, password) => {
        if (!pendingTx || !targetWallet) return;

        const { toAddress, amount } = pendingTx;
        const fromAddress = targetWallet.address;

        try {
            let wallet;
            if (targetWallet.type === 'imported') {
                const decryptedKey = decryptData(targetWallet.privateKey, password);
                wallet = new Wallet(decryptedKey, provider);
            } else {
                const seed = await mnemonicToSeedSync(decryptedMnemonic);
                let foundIndex = targetWallet.index;
                const path = `m/44'/60'/0'/0/${foundIndex}`;
                const hdNode = HDNodeWallet.fromSeed(seed);
                const child = hdNode.derivePath(path);
                wallet = new Wallet(child.privateKey, provider);
            }

            const tx = await wallet.sendTransaction({
                to: toAddress,
                value: parseEther(amount)
            });

            await tx.wait();
            refreshBalances();

            return tx.hash;

        } catch (error) {
            console.error("Send error:", error);
            throw error;
        } finally {
            setPendingTx(null);
            setTargetWallet(null);
        }
    };

    const [pendingTx, setPendingTx] = useState(null); // { toAddress, amount, resolve, reject }

    const handleSend = async (fromAddress, toAddress, amount) => {
        const senderWallet = addresses.find(w => w.address === fromAddress);
        setTargetWallet(senderWallet);

        return new Promise((resolve, reject) => {
            setPendingTx({ toAddress, amount, resolve, reject });
            setPasswordAction('send');
            setShowPasswordPrompt(true);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">Ethereum</h2>
                    <button onClick={refreshBalances} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    </button>
                </div>
                <div className="flex flex-1 justify-end">
                    {!showImportInput ? (
                        <div className="flex gap-2">
                            <button onClick={addWallet} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                + Add Wallet
                            </button>
                            <button onClick={() => setShowImportInput(true)} className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                Import
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-1 w-full sm:max-w-sm">
                            <input
                                type="text"
                                placeholder="Paste Private Key"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white min-w-0 flex-1"
                                value={importKeyInput}
                                onChange={(e) => setImportKeyInput(e.target.value)}
                            />
                            <button onClick={handleImportWallet} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1.5 rounded-lg text-xs font-bold shrink-0">
                                Add
                            </button>
                            <button onClick={() => setShowImportInput(false)} className="text-slate-400 hover:text-white px-2 shrink-0">
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {addresses.map((p, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-4 md:p-6 hover:bg-slate-750 transition-all shadow-lg group relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

                        {/* Top Actions: Key & Delete */}
                        <div className="absolute top-4 right-4 flex gap-2 z-20">
                            <button
                                onClick={() => initiateViewKey(p)}
                                className="text-slate-600 hover:text-white transition-colors p-1"
                                title="View Private Key"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDelete(p.address)}
                                className="text-slate-600 hover:text-red-500 transition-colors p-1"
                                title="Remove Wallet"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 font-bold text-sm shadow-inner">
                                    Ξ
                                </div>
                                <div>
                                    <span className="text-slate-200 font-semibold block">
                                        Wallet {index + 1}
                                        {p.type === 'imported' && <span className="ml-2 text-[10px] bg-blue-900 text-blue-200 px-1 rounded border border-blue-800">Imported</span>}
                                    </span>
                                    <span className="text-slate-500 text-xs font-mono">Sepolia</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 relative z-10">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Balance</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">{p.balance}</span>
                                <span className="text-blue-400 text-sm font-medium">ETH</span>
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={() => setModalConfig({ isOpen: true, action: 'receive', address: p.address })}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Receive
                            </button>
                            <button
                                onClick={() => setModalConfig({ isOpen: true, action: 'send', address: p.address })}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/10"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {modalConfig && (
                <WalletActionModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(null)}
                    action={modalConfig.action}
                    walletAddress={modalConfig.address}
                    network="ETH"
                    onSend={(to, amount) => handleSend(modalConfig.address, to, amount)}
                />
            )}

            {deleteConfig && (
                <DeleteWalletModal
                    isOpen={deleteConfig.isOpen}
                    onClose={() => setDeleteConfig(null)}
                    onConfirm={confirmDelete}
                    walletType={deleteConfig.type}
                    hasFunds={deleteConfig.hasFunds}
                />
            )}

            <PasswordPromptModal
                isOpen={showPasswordPrompt}
                onClose={() => setShowPasswordPrompt(false)}
                onSuccess={handlePasswordSuccess}
            />

            <PrivateKeyModal
                isOpen={!!showPrivateKeyModal}
                onClose={() => setShowPrivateKeyModal(null)}
                privateKey={showPrivateKeyModal?.secretKey || ''}
            />

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    )
}