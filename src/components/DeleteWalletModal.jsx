import React, { useState } from 'react';
import { Modal } from './Modal';

export const DeleteWalletModal = ({ isOpen, onClose, onConfirm, walletType, hasFunds }) => {
    const [confirmedBackup, setConfirmedBackup] = useState(false);

    const handleConfirm = () => {
        if (walletType === 'imported' && !confirmedBackup) {
            return;
        }
        onConfirm();
        setConfirmedBackup(false);
    };

    const isImported = walletType === 'imported';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={hasFunds ? "⚠️ Wallet Has Funds!" : "Remove Wallet"}>
            <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-200">
                    <p className="font-bold mb-2">
                        {isImported
                            ? "PERMANENT DELETION WARNING"
                            : "Hiding Wallet Pattern"}
                    </p>
                    <p>
                        {isImported
                            ? "This is an imported private key. If you remove it, it will be deleted from this device PERMANENTLY. You must have your private key backed up to restore it."
                            : "This will hide the wallet from your list. You can add it back later, but it's safer to ensure you have your seed phrase backed up."}
                    </p>
                    {hasFunds && (
                        <p className="mt-2 font-bold text-red-400">
                            detected positive balance! Do not remove unless you are 100% sure.
                        </p>
                    )}
                </div>

                {isImported && (
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 transition-colors">
                        <input
                            type="checkbox"
                            id="confirm-backup"
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                            checked={confirmedBackup}
                            onChange={(e) => setConfirmedBackup(e.target.checked)}
                        />
                        <label htmlFor="confirm-backup" className="text-sm text-slate-300 cursor-pointer select-none">
                            I have backed up my Private Key
                        </label>
                    </div>
                )}

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isImported && !confirmedBackup}
                        className={`px-4 py-2 rounded-lg text-white text-sm font-bold shadow-lg transition-all
                            ${(isImported && !confirmedBackup)
                                ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'}`}
                    >
                        {isImported ? "Delete Permanently" : "Hide Wallet"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
