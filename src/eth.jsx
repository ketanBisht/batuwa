import { useState, useEffect } from "react";
import { mnemonicToSeedSync } from "bip39";
import { Wallet, HDNodeWallet, JsonRpcProvider, formatEther, parseEther } from "ethers";
import { WalletActionModal } from "./components/WalletActionModal";

// Simplified connection to Sepolia
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");

export const EthWallet = ({ mnemonic }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [addresses, setAddresses] = useState([]);
    const [modalConfig, setModalConfig] = useState(null);

    useEffect(() => {
        const storedWallets = JSON.parse(localStorage.getItem('eth_wallets') || '[]');
        setAddresses(storedWallets);
        setCurrentIndex(storedWallets.length);
    }, []);

    useEffect(() => {
        if (addresses.length > 0) {
            localStorage.setItem('eth_wallets', JSON.stringify(addresses));
        }
    }, [addresses]);

    const addWallet = async () => {
        const seed = await mnemonicToSeedSync(mnemonic);
        let index = 0;
        let pAddress = null;
        let balance = 0;

        while (true) {
            const derivationPath = `m/44'/60'/${index}'/0'`;
            const hdNode = HDNodeWallet.fromSeed(seed);
            const child = hdNode.derivePath(derivationPath);
            const address = child.address;

            const exists = addresses.some(w => w.address === address);
            if (!exists) {
                pAddress = address;
                try {
                    balance = await fetchBalance(address);
                } catch (e) {
                    console.error(e);
                }
                break;
            }
            index++;
        }

        setAddresses([...addresses, {
            address: pAddress,
            balance: balance
        }]);
    };

    const handleDelete = (address) => {
        if (confirm("Are you sure you want to hide this wallet? You can restore it later by adding wallets.")) {
            setAddresses(addresses.filter(w => w.address !== address));
        }
    };

    const fetchBalance = async (address) => {
        try {
            const balance = await provider.getBalance(address);
            return formatEther(balance);
        } catch (e) {
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

    const handleSend = async (fromAddress, toAddress, amount) => {
        try {
            // Re-derive private key for signing
            const seed = await mnemonicToSeedSync(mnemonic);

            // Find finding correct index via loop since we have gaps
            let foundIndex = -1;
            for (let i = 0; i < 100; i++) {
                const derivationPath = `m/44'/60'/${i}'/0'`;
                const hdNode = HDNodeWallet.fromSeed(seed);
                const child = hdNode.derivePath(derivationPath);
                if (child.address === fromAddress) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex === -1) throw new Error("Could not find private key for this wallet");

            const derivationPath = `m/44'/60'/${foundIndex}'/0'`;
            const hdNode = HDNodeWallet.fromSeed(seed);
            const child = hdNode.derivePath(derivationPath);
            const wallet = new Wallet(child.privateKey, provider);

            const tx = await wallet.sendTransaction({
                to: toAddress,
                value: parseEther(amount)
            });

            alert(`Sent! Hash: ${tx.hash}`);
            await tx.wait();
            refreshBalances();
        } catch (error) {
            alert(`Error sending: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">Ethereum</h2>
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
                {addresses.map((p, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750 transition-all shadow-lg group relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleDelete(p.address)}
                            className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors z-20 p-1"
                            title="Remove Wallet"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 font-bold text-sm shadow-inner">
                                    Ξ
                                </div>
                                <div>
                                    <span className="text-slate-200 font-semibold block">Wallet {index + 1}</span>
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
        </div>
    )
}