import React from 'react';
import { Modal } from './Modal';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", type = "danger" }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col gap-6">
                <p className="text-slate-300 text-sm leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors shadow-lg ${type === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
