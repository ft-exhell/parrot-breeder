import { useState, useEffect } from 'react';
import twitterLogo from './assets/twitter-logo.svg';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3, BN } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';
import './App.css';

// Solana runtime
const { SystemProgram, Keypair } = web3;

// Account that will hold gif data
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Program's ID from the idl file
const programID = new PublicKey(idl.metadata.address);

// Set network to devnet
const network = clusterApiUrl('devnet');

// Control how we want to acknowledge when the transaction is done
const opts = {
  preflightCommitment: 'processed'

}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp'
]

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [tipSize, setTipSize] = useState('');
  const [gifList, setGifList] = useState([]);

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

  const sendGif = async () => {
    if (inputValue.length == 0) {
      console.log('No link given');
      return
    }
    setInputValue('');
    console.log('Gif link', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      })
      console.log('Gif successfully sent to the program', inputValue);

      await getGifList();
    } catch (err) {
      console.log('Error sending GIFs', err);
    }
  }

  const vote = (giflink) => async (event) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.updateGif(giflink, {
        accounts: {
          baseAccount: baseAccount.publicKey
        }
      })
    } catch (err) {
      console.log('Error upvoting', err)
    }
  }

  const tip = async (item) => {
    if (tipSize == 0) {
      console.log('Amount not specified');
      return
    }
    setTipSize('');
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const to = item.user.toString()

      await program.rpc.sendTip(new BN(parseInt(tipSize)), {
        accounts: {
          from: provider.wallet.publicKey,
          to,
          systemProgram: SystemProgram.programId
        }
      })
      console.log('Successfully tipped', to)
    } catch (err) {
      console.log('Error tipping', err)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const onTipChange = (event) => {
    const { value } = event.target;
    setTipSize(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment
    );
    return provider;
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log('Got the account ', account);
      setGifList(account.gifList);
    } catch (err) {
      console.log('Error in get GIF list: ', err);
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping');
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log('Created a new Base Account w/ address: ', baseAccount.publicKey.toString());
      await getGifList();
    } catch (err) {
      console.log('Error creating Base Account ', err);
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
    // In case the program's account hasn't been initiated
    if (gifList == null) {
      return (
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>
            Do a one-time initialization for GIF program account.
          </button>
        </div>
      )
    }
    // Account exists, can submit gifs
    else {
      return (
        <div className='сonnected-container'>
        <form
          onSubmit={event => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input 
            type="text" 
            placeholder="Enter your gif link" 
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className='gif-grid'>
          {gifList.map((item, index) => (
            <div className='gif-item' key={index}>
              <img src={item.gifLink} />
              <span style={{color:"white"}}>Uploader: {item.user.toString()}</span>
              <span style={{color:"white"}}>Votes: {item.votes.toString()}</span>
              <button onClick={vote(item.gifLink.toString())}>Vote</button>
              <form
                onSubmit={event => {
                  event.preventDefault();
                  tip(item);
                }}
              >
                <input 
                  type="text" 
                  placeholder="Lamports to tip" 
                  value={tipSize}
                  onChange={onTipChange}
                />
                <button type="submit" className="cta-button submit-gif-button">Tip</button>
              </form>
            </div>
          ))}
        </div>
      </div>
      )
    }
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
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Parrot Breeder</p>
          <p className="sub-text">
            Parrots are horny...
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
