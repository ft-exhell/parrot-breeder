import { useState, useEffect } from 'react';
import axios from 'axios';
import { Connection, clusterApiUrl, Transaction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout} from '@solana/spl-token';
import * as metaplex from '@metaplex/js';

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [ownedNFTs, setOwnedNFTs] = useState(null);

  // Check if Phantom is connected
  const checkWalletConnection = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found.');

          // Connect to the wallet
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with the Public Key:',
            response.publicKey.toString()
          ); 
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        alert('Please install Phantom wallet.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log(
        'Connected with the Public Key:',
        response.publicKey.toString()
      )
      setWalletAddress(response.publicKey.toString());
    }
  }

  const getProvider = () => {
    const network = clusterApiUrl('mainnet-beta')
    const connection = new Connection(network, { preflightCommitment: 'processed' });
    const provider = new anchor.Provider(
      connection, window.solana, { preflightCommitment: 'processed' }
    );

    return provider;
  }

  const fetchOwnedNFTs = async () => {
    try {
      const network = clusterApiUrl('mainnet-beta')
      const connection = new Connection(network, { preflightCommitment: 'processed' });      
  
      const nfts = await metaplex.programs.metadata.Metadata.findDataByOwner(connection, walletAddress);

      setOwnedNFTs(nfts)
    } catch (err) {
      console.log('Error fetching data: ', err);
      setOwnedNFTs(null)
    }
  }

  const setWalletTransaction = async (instructions) => {
    const provider = getProvider();
    const transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    transaction.feePayer = provider.wallet.publicKey;
    let hash = await provider.connection.getRecentBlockhash();
    console.log("blockhash", hash);
    transaction.recentBlockhash = hash.blockhash;
    return transaction;
  }

  const signAndSend = async (provider, transaction) => {
    const signedTrans = await provider.wallet.signTransaction(transaction);
    const signature = await provider.connection.sendRawTransaction(signedTrans.serialize());
    return signature
  }

  const sendParrot = async (mintAddress) => {
    try {
      const network = clusterApiUrl('mainnet-beta')
      const connection = new Connection(network, { preflightCommitment: 'processed' });  
      const provider = getProvider();

      const owner = new anchor.web3.PublicKey(walletAddress)
      const receiver = new anchor.web3.PublicKey('5u72NyJ2gvwKfzGg25bgUMzya1b3g889m6C6xTDJrL2V')
      const mint = new anchor.web3.PublicKey(mintAddress)

      const rent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );

      const fromTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        owner
      )

      const toTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID, 
        TOKEN_PROGRAM_ID, 
        mint, 
        receiver
      )

      const toTokenAccountInfo = await provider.connection.getAccountInfo(toTokenAccount);

      if (toTokenAccountInfo == null) {
        const instructions = [
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            toTokenAccount,
            receiver,
            provider.wallet.publicKey
          ),
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            fromTokenAccount,
            toTokenAccount,
            owner,
            [],
            1
          )
        ]
        
        const trans = await setWalletTransaction(instructions)

        const signature = await signAndSend(provider, trans)

        let result = await provider.connection.confirmTransaction(signature, "singleGossip");
        console.log(result)
      } else {
        const instruction = Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount,
          toTokenAccount,
          owner,
          [],
          1
        )

        const trans = await setWalletTransaction(instruction)
        const signature = await signAndSend(provider, trans)
        const result = await provider.connection.confirmTransaction(signature, 'singleGossip')
      }

    } catch (err) {
      console.log('Error sending Parrot:', err);
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect Phantom
    </button>
  )

  const renderConnectedContainer = () => {
    return(
      <div>
        {ownedNFTs.map((nft, index) => (
          <div>
            <span>{nft.data.name}</span>
            <button onClick={() => sendParrot(nft.mint)}>Send</button>
          </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkWalletConnection();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching NFT list...');
      fetchOwnedNFTs();
    }
  }, [walletAddress])

  return(
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Parrot Breeder</p>
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && ownedNFTs && renderConnectedContainer()}
        </div>
      </div>
    </div>  
  )
}

export default App;