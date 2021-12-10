import { useState, useEffect } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

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
    if (inputValue.length > 0) {
      console.log(`Gif link: ${inputValue}`)
      setGifList([...gifList, inputValue]);
      setInputValue('');
    } else {
      console.log('Empty input, try again.')
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect Phantom
    </button>
  )

  const renderConnectedContainer = () => (
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
        {gifList.map(gif => (
          <div className='gif-item' key={gif}>
          <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  )

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
      
      // Call Solana program here

      // Set state
      setGifList(TEST_GIFS);
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
