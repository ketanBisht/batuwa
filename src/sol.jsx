import { useState, useEffect } from "react"
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import nacl from "tweetnacl"
import { WalletActionModal } from "./components/WalletActionModal";

// Simplified connection to devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export function SolanaWallet({ mnemonic }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [publicKeys, setPublicKeys] = useState([]);
    const [modalConfig, setModalConfig] = useState(null); // { isOpen, action, address }

    useEffect(() => {
        const storedWallets = JSON.parse(localStorage.getItem('solana_wallets') || '[]');
        setPublicKeys(storedWallets);
        setCurrentIndex(storedWallets.length);
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
            balance: balance
        }]);
    };

    const handleDelete = (address) => {
        if (confirm("Are you sure you want to hide this wallet? You can restore it later by adding wallets.")) {
            setPublicKeys(publicKeys.filter(w => w.toBase58 !== address));
        }
    };

    const fetchBalance = async (publicKey) => {
        try {
            const balance = await connection.getBalance(new PublicKey(publicKey));
            return balance / LAMPORTS_PER_SOL;
        } catch (e) {
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

    const handleSend = async (fromAddress, toAddress, amount) => {
        try {
            // Re-derive private key for signing
            const seed = await mnemonicToSeedSync(mnemonic);

            // We need to find the correct index for this specific address to sign
            // Since we allow deleting/re-adding, we can't assume index matches array position
            // We must brute-force find the index that generates this address
            // OR checks derived addresses against the sender.
            // Brute-force is safer given we expect < 20 wallets usually.

            let foundIndex = -1;
            for (let i = 0; i < 100; i++) {
                const path = `m/44'/501'/${i}'/0'`;
                const derivedSeed = derivePath(path, seed.toString("hex")).key;
                const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
                const keypair = Keypair.fromSecretKey(secret);
                if (keypair.publicKey.toBase58() === fromAddress) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex === -1) throw new Error("Could not find private key for this wallet");

            const path = `m/44'/501'/${foundIndex}'/0'`;
            const derivedSeed = derivePath(path, seed.toString("hex")).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
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
            alert(`Sent! Signature: ${signature}`);
            refreshBalances();
        } catch (error) {
            alert(`Error sending: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">Solana</h2>
                <div className="flex gap-2">
                    <button onClick={refreshBalances} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    </button>
                    <button onClick={addWallet} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        + Add Wallet
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {publicKeys.map((p, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750 transition-all shadow-lg group relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleDelete(p.toBase58)}
                            className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors z-20 p-1"
                            title="Remove Wallet"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-teal-400 font-bold text-sm shadow-inner">
                                    ◎
                                </div>
                                <div>
                                    <span className="text-slate-200 font-semibold block">Wallet {index + 1}</span>
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
        </div>
    )
}