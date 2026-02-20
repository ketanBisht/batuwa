import { useState } from 'react';
import { generateMnemonic } from 'bip39';
import { encryptData } from '../utils/crypto';

export const Onboarding = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mnemonic, setMnemonic] = useState('');
    const [step, setStep] = useState('password'); // password | seed

    const handleCreatePassword = () => {
        if (password.length < 4) {
            alert("Password looks too weak.");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        const mn = generateMnemonic();
        setMnemonic(mn);

        // Encrypt and save immediately
        const encrypted = encryptData(mn, password);
        localStorage.setItem('encrypted_mnemonic', encrypted);

        setStep('seed');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                {step === 'password' ? 'Create Password' : 'Secure Your Wallet'}
            </h2>

            <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl">
                {step === 'password' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                placeholder="Choose a strong password"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                placeholder="Confirm password"
                            />
                        </div>
                        <button
                            onClick={handleCreatePassword}
                            disabled={!password || !confirmPassword}
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white py-3 rounded-lg font-bold shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-yellow-500/20">
                            <p className="text-yellow-400 text-sm text-center">
                                ⚠️ Save these words safely. You cannot recover your wallet without them.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 bg-slate-900/50 p-3 md:p-4 rounded-xl">
                            {mnemonic.split(" ").map((word, index) => (
                                <div key={index} className="text-center">
                                    <span className="text-slate-500 text-[10px] md:text-xs mr-1 md:mr-2">{index + 1}.</span>
                                    <span className="text-slate-200 font-medium text-xs md:text-sm">{word}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                            <button
                                onClick={() => navigator.clipboard.writeText(mnemonic)}
                                className="w-full md:flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Copy Phrase
                            </button>
                            <button
                                onClick={() => onComplete(mnemonic)}
                                className="w-full md:flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg font-bold shadow-lg transition-all"
                            >
                                I Saved It
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
