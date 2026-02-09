import { useState } from "react";
import { mnemonicToSeedSync } from "bip39";
import { Wallet, HDNodeWallet, JsonRpcProvider, formatEther } from "ethers";

export const EthWallet = ({ mnemonic }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [addresses, setAddresses] = useState([]);

    return (
        <div>
            <button onClick={async function () {
                const seed = await mnemonicToSeedSync(mnemonic);
                const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
                const hdNode = HDNodeWallet.fromSeed(seed);
                const child = hdNode.derivePath(derivationPath);
                const privateKey = child.privateKey;
                const wallet = new Wallet(privateKey);
                setCurrentIndex(currentIndex + 1);

                // Default to Sepolia
                const provider = new JsonRpcProvider("https://sepolia.drpc.org");
                const balance = await provider.getBalance(wallet.address);

                setAddresses([...addresses, {
                    address: wallet.address,
                    balance: formatEther(balance)
                }]);
            }}>
                Add ETH wallet
            </button>

            {addresses.map((p, index) => <div key={index}>
                Eth - {p.address} | Balance: {p.balance} ETH
            </div>)}
        </div>
    )
}