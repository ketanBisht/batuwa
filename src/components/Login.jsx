import { useState } from 'react';
import { decryptData } from '../utils/crypto';

export const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        const encryptedMnemonic = localStorage.getItem('encrypted_mnemonic');
        if (!encryptedMnemonic) {
            setError('No wallet found. Please clear storage to reset.');
            return;
        }

        const decrypted = decryptData(encryptedMnemonic, password);
        if (decrypted) {
            onLogin(decrypted);
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                Welcome Back
            </h2>
            <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Enter your password"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
                    >
                        Unlock Wallet
                    </button>
                </div>
            </div>
        </div>
    );
};
