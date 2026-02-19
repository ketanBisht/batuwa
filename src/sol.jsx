import { useState, useEffect } from "react"
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import nacl from "tweetnacl"
import bs58 from "bs58";
import { WalletActionModal } from "./components/WalletActionModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { PasswordPromptModal } from "./components/PasswordPromptModal";
import { PrivateKeyModal } from "./components/PrivateKeyModal";

// Simplified connection to devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export function SolanaWallet({ mnemonic }) {
    const [publicKeys, setPublicKeys] = useState([]);
    const [modalConfig, setModalConfig] = useState(null); // { isOpen, action, address }
    const [deleteConfig, setDeleteConfig] = useState(null); // { isOpen, address }

    // Security / Keys
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [passwordAction, setPasswordAction] = useState(null); // 'view_key' | 'import'
    const [targetWallet, setTargetWallet] = useState(null);
    const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(null); // { secretKey }
    const [showImportInput, setShowImportInput] = useState(false);
    const [importKeyInput, setImportKeyInput] = useState('');

    useEffect(() => {
        const storedWallets = JSON.parse(localStorage.getItem('solana_wallets') || '[]');
        setPublicKeys(storedWallets);
    }, []);

    useEffect(() => {
        if (publicKeys.length > 0) {
            localStorage.setItem('solana_wallets', JSON.stringify(publicKeys));
        }
    }, [publicKeys]);

    const addWallet = async () => {
        const seed = await mnemonicToSeedSync(mnemonic);
        let index = 0;
        let pKey = null;
        let balance = 0;

        // Loop to find the first unused derivation path
        while (true) {
            const path = `m/44'/501'/${index}'/0'`;
            const derivedSeed = derivePath(path, seed.toString("hex")).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
            const keypair = Keypair.fromSecretKey(secret);
            const address = keypair.publicKey.toBase58();

            const exists = publicKeys.some(w => w.toBase58 === address);
            if (!exists) {
                pKey = address;
                try {
                    balance = await fetchBalance(address);
                } catch (e) {
                    console.error(e);
                }
                break;
            }
            index++;
        }

        setPublicKeys([...publicKeys, {
            toBase58: pKey,
            balance: balance,
            type: 'hd' // Hierarchical Deterministic
        }]);
    };

    const handleImportWallet = () => {
        try {
            // Assume input is base58 encoded secret key
            const secret = bs58.decode(importKeyInput);
            const keypair = Keypair.fromSecretKey(secret);
            const address = keypair.publicKey.toBase58();

            const exists = publicKeys.some(w => w.toBase58 === address);
            if (exists) {
                alert("Wallet already exists!");
                return;
            }

            setPublicKeys([...publicKeys, {
                toBase58: address,
                balance: 0,
                type: 'imported',
                secret: bs58.encode(secret) // Storing plain text secret for imported wallets (simple implementation as requested)
                // Ideally this should be encrypted with the user's password too.
            }]);
            setImportKeyInput('');
            setShowImportInput(false);
            refreshBalances();
        } catch (e) {
            alert("Invalid Private Key. Please ensure it is base58 encoded.");
        }
    };

    const handleDelete = (address) => {
        const wallet = publicKeys.find(w => w.toBase58 === address);
        // Safeguard: Check balance
        if (wallet && wallet.balance > 0) {
            setDeleteConfig({ isOpen: true, address, hasFunds: true });
        } else {
            setDeleteConfig({ isOpen: true, address, hasFunds: false });
        }
    };

    const confirmDelete = () => {
        if (deleteConfig?.address) {
            setPublicKeys(publicKeys.filter(w => w.toBase58 !== deleteConfig.address));
            setDeleteConfig(null);
        }
    };

    const initiateViewKey = (wallet) => {
        setTargetWallet(wallet);
        setPasswordAction('view_key');
        setShowPasswordPrompt(true);
    };

    const handlePasswordSuccess = async (decryptedMnemonic) => {
        setShowPasswordPrompt(false);
        if (passwordAction === 'view_key' && targetWallet) {
            let secretKeyString = '';

            if (targetWallet.type === 'imported') {
                secretKeyString = targetWallet.secret;
            } else {
                // Re-derive
                // We need to find the index again or just brute force matching
                const seed = await mnemonicToSeedSync(decryptedMnemonic);
                const address = targetWallet.toBase58;

                let found = false;
                for (let i = 0; i < 100; i++) {
                    const path = `m/44'/501'/${i}'/0'`;
                    const derivedSeed = derivePath(path, seed.toString("hex")).key;
                    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
                    const keypair = Keypair.fromSecretKey(secret);
                    if (keypair.publicKey.toBase58() === address) {
                        secretKeyString = bs58.encode(secret);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    alert("Could not derive key. Mismatch?");
                    return;
                }
            }

            setShowPrivateKeyModal({ secretKey: secretKeyString });
            setTargetWallet(null);
        } else if (passwordAction === 'send' && pendingTx) {
            try {
                const signature = await executeSend(decryptedMnemonic);
                if (pendingTx.resolve) pendingTx.resolve(signature);
            } catch (error) {
                if (pendingTx.reject) pendingTx.reject(error);
            }
        }
    };

    const fetchBalance = async (publicKey) => {
        try {
            const response = await fetch(`http://localhost:3000/api/balance/sol/${publicKey}`);
            const data = await response.json();
            if (data.balance !== undefined) {
                return data.balance;
            }
            return 0;
        } catch (e) {
            console.error("Failed to fetch SOL balance:", e);
            return 0;
        }
    };

    const refreshBalances = async () => {
        const updatedWallets = await Promise.all(publicKeys.map(async (wallet) => {
            const balance = await fetchBalance(wallet.toBase58);
            return { ...wallet, balance };
        }));
        setPublicKeys(updatedWallets);
    };

    const executeSend = async (decryptedMnemonic) => {
        if (!pendingTx || !targetWallet) return;

        const { toAddress, amount } = pendingTx;
        const fromAddress = targetWallet.toBase58;

        try {
            let secret;
            if (targetWallet.type === 'imported') {
                secret = bs58.decode(targetWallet.secret);
            } else {
                const seed = await mnemonicToSeedSync(decryptedMnemonic);
                let foundIndex = -1;
                for (let i = 0; i < 100; i++) {
                    const path = `m/44'/501'/${i}'/0'`;
                    const derivedSeed = derivePath(path, seed.toString("hex")).key;
                    const s = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
                    const keypair = Keypair.fromSecretKey(s);
                    if (keypair.publicKey.toBase58() === fromAddress) {
                        foundIndex = i;
                        secret = s;
                        break;
                    }
                }
                if (foundIndex === -1) throw new Error("Could not find private key for this wallet");
            }

            const keypair = Keypair.fromSecretKey(secret);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: new PublicKey(toAddress),
                    lamports: amount * LAMPORTS_PER_SOL,
                })
            );

            const signature = await connection.sendTransaction(transaction, [keypair]);
            await connection.confirmTransaction(signature, 'processed');
            refreshBalances();
            return signature;

        } catch (error) {
            console.error("SOL Send error:", error);
            throw error;
        } finally {
            setPendingTx(null);
            setTargetWallet(null);
        }
    };

    const [pendingTx, setPendingTx] = useState(null);

    const handleSend = async (fromAddress, toAddress, amount) => {
        const senderWallet = publicKeys.find(w => w.toBase58 === fromAddress);
        setTargetWallet(senderWallet);

        return new Promise((resolve, reject) => {
            setPendingTx({ toAddress, amount, resolve, reject });
            setPasswordAction('send');
            setShowPasswordPrompt(true);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">Solana</h2>
                <div className="flex gap-2">
                    <button onClick={refreshBalances} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    </button>
                    {!showImportInput ? (
                        <>
                            <button onClick={addWallet} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                + Add Wallet
                            </button>
                            <button onClick={() => setShowImportInput(true)} className="bg-slate-800 hover:bg-slate-700 text-teal-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Import
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Paste Private Key (Base58)"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white w-48"
                                value={importKeyInput}
                                onChange={(e) => setImportKeyInput(e.target.value)}
                            />
                            <button onClick={handleImportWallet} className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                Add
                            </button>
                            <button onClick={() => setShowImportInput(false)} className="text-slate-400 hover:text-white px-2">
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {publicKeys.map((p, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750 transition-all shadow-lg group relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

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
                                onClick={() => handleDelete(p.toBase58)}
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
                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-teal-400 font-bold text-sm shadow-inner">
                                    ◎
                                </div>
                                <div>
                                    <span className="text-slate-200 font-semibold block">
                                        Wallet {index + 1}
                                        {p.type === 'imported' && <span className="ml-2 text-[10px] bg-teal-900 text-teal-200 px-1 rounded border border-teal-800">Imported</span>}
                                    </span>
                                    <span className="text-slate-500 text-xs font-mono">Devnet</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 relative z-10">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Balance</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">{p.balance}</span>
                                <span className="text-teal-400 text-sm font-medium">SOL</span>
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={() => setModalConfig({ isOpen: true, action: 'receive', address: p.toBase58 })}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Receive
                            </button>
                            <button
                                onClick={() => setModalConfig({ isOpen: true, action: 'send', address: p.toBase58 })}
                                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-teal-500/10"
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
                    network="SOL"
                    onSend={(to, amount) => handleSend(modalConfig.address, to, amount)}
                />
            )}

            {deleteConfig && (
                <ConfirmationModal
                    isOpen={deleteConfig.isOpen}
                    onClose={() => setDeleteConfig(null)}
                    onConfirm={confirmDelete}
                    title={deleteConfig.hasFunds ? "Warning: Funds Detected!" : "Hide Wallet?"}
                    message={deleteConfig.hasFunds
                        ? "This wallet looks like it has funds (" + publicKeys.find(w => w.toBase58 === deleteConfig.address)?.balance + " SOL). If you hide it without saving the Private Key, you might lose access forever. We recommend viewing and saving the key first."
                        : "Are you sure you want to hide this wallet? You can likely restore it later."
                    }
                    confirmText="Hide Anyway"
                    type={deleteConfig.hasFunds ? "danger" : "danger"}
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
        </div>
    )
}