import { useState } from 'react';
import QRCode from "react-qr-code";
import { Modal } from './Modal';

export const WalletActionModal = ({ isOpen, onClose, action, walletAddress, network, onSend }) => {
    // action: 'send' | 'receive'
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', message: '' }

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        setSending(true);
        setStatus(null);
        try {
            const signature = await onSend(recipient, amount);
            setStatus({ type: 'success', message: `Sent Successfully! ${signature ? `Tx: ${signature.slice(0, 8)}...` : ''}` });
            setRecipient('');
            setAmount('');
            // Optional: Close after success or let user close
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Transaction failed' });
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={action === 'receive' ? 'Receive Assets' : 'Send Assets'}>
            {action === 'receive' ? (
                <div className="flex flex-col items-center space-y-6">
                    <div className="bg-white p-4 rounded-xl">
                        <QRCode value={walletAddress} size={200} />
                    </div>
                    <div className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={handleCopy}>
                        <span className="text-slate-400 text-sm font-mono truncate mr-2">
                            {walletAddress.slice(0, 20)}...{walletAddress.slice(-4)}
                        </span>
                        {copied ? (
                            <span className="text-green-500 text-xs font-bold">Copied!</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm text-center">
                        Scan this code to receive {network} tokens.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Recipient Address</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder={`Enter ${network} address`}
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Amount</label>
                        <input
                            type="number"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {status && (
                        <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {status.message}
                        </div>
                    )}

                    <button
                        onClick={handleSend}
                        disabled={sending || !recipient || !amount}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {sending ? 'Sending...' : 'Send Now'}
                    </button>
                </div>
            )}
        </Modal>
    );
}
