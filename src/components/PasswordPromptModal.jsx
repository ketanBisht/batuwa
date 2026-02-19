import { useState } from 'react';
import { Modal } from './Modal';
import { decryptData } from '../utils/crypto';

export const PasswordPromptModal = ({ isOpen, onClose, onSuccess, title = "Security Check" }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const encryptedMnemonic = localStorage.getItem('encrypted_mnemonic');
        if (!encryptedMnemonic) {
            setError("No wallet found.");
            return;
        }

        const decrypted = decryptData(encryptedMnemonic, password);
        if (decrypted) {
            onSuccess(decrypted); // Pass mnemonic back to caller
            setPassword('');
            setError('');
        } else {
            setError("Incorrect password");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-slate-400 text-sm">Please enter your password to continue.</p>
                <input
                    type="password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg transition-colors mt-2"
                >
                    Confirm
                </button>
            </div>
        </Modal>
    );
};
