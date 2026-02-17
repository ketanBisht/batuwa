import CryptoJS from 'crypto-js';

// Encrypt string with password
export const encryptData = (data, password) => {
    return CryptoJS.AES.encrypt(data, password).toString();
};

// Decrypt string with password
export const decryptData = (encryptedData, password) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, password);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (e) {
        return null;
    }
};
