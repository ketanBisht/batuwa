import { useState, useEffect } from "react";
import { mnemonicToSeedSync } from "bip39";
import { Wallet, HDNodeWallet } from "ethers";

export const EthWallet = ({ mnemonic }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [addresses, setAddresses] = useState([]);

    // Load state from localStorage on mount
    useEffect(() => {
        const storedWallets = JSON.parse(localStorage.getItem('eth_wallets') || '[]');
        setAddresses(storedWallets);
        setCurrentIndex(storedWallets.length);
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        if (addresses.length > 0) {
            localStorage.setItem('eth_wallets', JSON.stringify(addresses));
        }
    }, [addresses]);

    const addWallet = async () => {
        const seed = await mnemonicToSeedSync(mnemonic);
        const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
        const hdNode = HDNodeWallet.fromSeed(seed);
        const child = hdNode.derivePath(derivationPath);
        const privateKey = child.privateKey;
        const wallet = new Wallet(privateKey);

        setCurrentIndex(prev => prev + 1);

        try {
            const balance = await fetchBalance(wallet.address);
            setAddresses([...addresses, {
                address: wallet.address,
                balance: balance
            }]);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBalance = async (address) => {
        const response = await fetch(`http://localhost:3000/api/balance/eth/${address}`);
        const data = await response.json();
        return data.balance;
    };

    const refreshBalances = async () => {
        const updatedWallets = await Promise.all(addresses.map(async (wallet) => {
            const balance = await fetchBalance(wallet.address);
            return { ...wallet, balance };
        }));
        setAddresses(updatedWallets);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">Ethereum Wallets</h2>
                <div className="flex gap-2">
                    <button
                        onClick={refreshBalances}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700 transition-colors"
                        title="Refresh Balances"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                    <button
                        onClick={addWallet}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors shadow-sm"
                    >
                        + Add Wallet
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {addresses.map((p, index) => (
                    <div key={index} className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 shadow-xl group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shadow-inner overflow-hidden">
                                    <span className="scale-125">Ξ</span>
                                </div>
                                <div>
                                    <span className="text-slate-200 font-semibold block">Wallet {index + 1}</span>
                                    <span className="text-slate-500 text-xs font-mono">ETH</span>
                                </div>
                            </div>
                            <div className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20 font-medium">
                                Sepolia
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold ml-1">Address</p>
                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                                <p className="text-slate-300 font-mono text-sm truncate w-full mr-4 select-all">{p.address}</p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(p.address)}
                                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
                                    title="Copy Address"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-700/50 flex justify-between items-end">
                            <span className="text-slate-400 text-sm font-medium">Balance</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-white tracking-tight block leading-none">{p.balance}</span>
                                <span className="text-slate-500 text-xs font-medium uppercase">ETH</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}