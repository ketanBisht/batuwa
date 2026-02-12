require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { JsonRpcProvider, formatEther } = require('ethers');
const { Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Providers
const ethProvider = new JsonRpcProvider(process.env.ETH_RPC_URL);
const solConnection = new Connection(process.env.SOL_RPC_URL, 'confirmed');

// ETH Balance Endpoint
app.get('/api/balance/eth/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await ethProvider.getBalance(address);
        res.json({
            address,
            balance: formatEther(balance),
            network: 'sepolia' // hardcoded for now
        });
    } catch (error) {
        console.error("ETH Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// SOL Balance Endpoint
app.get('/api/balance/sol/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const publicKey = new PublicKey(address);
        const balance = await solConnection.getBalance(publicKey);
        res.json({
            address,
            balance: balance / LAMPORTS_PER_SOL,
            network: 'devnet' // hardcoded for now
        });
    } catch (error) {
        console.error("SOL Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
