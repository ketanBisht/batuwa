import { useState } from 'react';
import { Modal } from './Modal';
import QRCode from "react-qr-code";

export const PrivateKeyModal = ({ isOpen, onClose, privateKey, purpose = "view" }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(privateKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Private Key">
            <div className="space-y-6 flex flex-col items-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full">
                    <p className="text-red-400 text-xs text-center font-bold uppercase tracking-wider">
                        Warning: Never share this key!
                    </p>
                    <p className="text-amber-500/80 text-xs text-center mt-1">
                        Anyone with this key can steal your funds.
                    </p>
                </div>

                <div className="bg-white p-3 rounded-xl">
                    <QRCode value={privateKey} size={150} />
                </div>

                <div
                    onClick={handleCopy}
                    className="w-full bg-slate-800 p-4 rounded-xl relative group cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700"
                >
                    <p className="text-slate-400 text-xs font-mono break-all text-center leading-relaxed select-all">
                        {privateKey}
                    </p>
                    <div className="absolute top-2 right-2">
                        {copied ? (
                            <span className="text-green-400 text-xs font-bold bg-slate-900/80 px-2 py-1 rounded">Copied!</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="w-full flex gap-3">
                    <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors">
                        Close
                    </button>
                    {purpose === 'safeguard' && (
                        <button className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold shadow-lg transition-colors">
                            I Saved It, Delete Now
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
