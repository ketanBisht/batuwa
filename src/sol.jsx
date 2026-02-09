import { useState } from "react"
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from "tweetnacl"

export function SolanaWallet({ mnemonic }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [publicKeys, setPublicKeys] = useState([]);

    return <div>
        <button onClick={async function () {
            const seed = await mnemonicToSeedSync(mnemonic);
            const path = `m/44'/501'/${currentIndex}'/0'`;
            const derivedSeed = derivePath(path, seed.toString("hex")).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
            const keypair = Keypair.fromSecretKey(secret);
            setCurrentIndex(currentIndex + 1);

            const connection = new Connection(clusterApiUrl("devnet"));
            const balance = await connection.getBalance(keypair.publicKey);

            setPublicKeys([...publicKeys, {
                toBase58: keypair.publicKey.toBase58(),
                balance: balance / LAMPORTS_PER_SOL
            }]);
        }}>
            Add SOL wallet
        </button>
        {publicKeys.map((p, index) => <div key={index}>
            {p.toBase58} | Balance: {p.balance} SOL
        </div>)}
    </div>
}