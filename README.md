# Batwa (Batuwa) Wallet 🪙

Batwa is a secure, multi-chain, non-custodial crypto wallet built for the modern web. It allows users to manage their digital assets across **Solana** and **Ethereum** with ease, all within a beautiful and intuitive interface.

Designed as both a standalone web application and a browser extension, Batwa prioritizes user sovereignty by keeping keys encrypted locally and never sharing them with any server.

---

## 🚀 Features

- **Multi-Chain Support**: Manage assets on Solana (Devnet) and Ethereum (Sepolia).
- **HD Wallet (BIP39/BIP44)**: Generate a single 12-word mnemonic phrase to manage multiple accounts across different chains.
- **Secure Local Storage**: Private keys and mnemonics are AES-encrypted with a user-defined password and stored only in your browser.
- **Import/Export**: Import existing accounts via private keys or export your keys for use in other wallets.
- **Real-time Balances**: Fetch live balances directly from the blockchain using Alchemy RPCs.
- **Clean UI/UX**: Built with React 19 and Tailwind CSS for a fast, responsive, and "glassmorphic" experience.

---

## 🛠️ Local Setup

To get Batwa running on your local machine, follow these steps:

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ketanBisht/batuwa.git
   cd batuwa/batwa
   ```

2. **Setup environment variables**:
   Create a `.env` file in the root directory and add your RPC URLs:
   ```bash
   VITE_ETH_RPC_URL=your_ethereum_rpc_url
   VITE_SOL_RPC_URL=your_solana_rpc_url
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## 🧩 Browser Extension Setup

Batwa is optimized to run as a browser extension.

1. **Build the project**:
   ```bash
   npm run build
   ```
   This will create a `dist` folder.

2. **Generate Zip (Optional)**:
   ```bash
   npm run build:zip
   ```

3. **Load into Chrome/Brave**:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right).
   - Click **Load unpacked**.
   - Select the `dist` folder from the project directory.

---

## 📁 Project Structure

- `src/components/`: Reusable UI components (Modals, Onboarding, Login, etc.).
- `src/sol.jsx`: Solana wallet logic (Key derivation, signing, balance fetching).
- `src/eth.jsx`: Ethereum wallet logic using `ethers.js`.
- `src/utils/crypto.js`: Encryption/Decryption utilities using AES.
- `public/manifest.json`: Configuration for the browser extension.

---

## ⚠️ Security & Important Notes

- **RPC URLs**: The project uses environment variables (`.env`) for RPC URLs. Ensure these are set correctly for the application to fetch balances and send transactions.
- **Storage**: Keys are stored in `localStorage`. Clearing your browser data will remove your wallet unless you have backed up your mnemonic phrase.
- **Imported Keys**: Imported private keys are **AES-encrypted** with your password before being stored. This provides an additional layer of security over plain-text storage.

---

## 🤝 Contributing

Feel free to open issues or submit pull requests to improve Batwa!

---

## 📄 License

This project is open-source. See the repository for license details.
