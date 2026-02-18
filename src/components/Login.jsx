import { useState } from 'react';
import { decryptData } from '../utils/crypto';

export const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mx-auto px-6">
            <div className="flex flex-col items-center gap-6 mb-12">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <img src="/batuwa.svg" alt="Batuwa Logo" className="relative h-40 w-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-300" />
                </div>
                <h1 className="text-5xl font-extrabold text-white tracking-tight mt-4">
                    Batuwa
                </h1>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                        placeholder="Password"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        )}
                    </button>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button
                    onClick={handleLogin}
                    className="w-full bg-white hover:bg-slate-200 text-black py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-lg"
                >
                    Unlock
                </button>
            </div>
        </div>
    );
};
