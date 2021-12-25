const anchor = require('@project-serum/anchor');

const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log('Starting the test...');

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Myepicproject;

  const baseAccount = anchor.web3.Keypair.generate();

  let tx  = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId
    },
    signers: [baseAccount]
  })

  console.log(`TX signature: ${tx}`);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log(`GIF count: ${account.totalGifs.toString()}`);

  await program.rpc.addGif("https://media.giphy.com/media/qtyUiCUuk0Sgh2YwdL/giphy.gif", {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey
    }
  })

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log(`GIF count: ${account.totalGifs.toString()}`);

  console.log('GIF List: ', account.gifList)
  
  console.log('GIF 0 votes', account.gifList[0].votes)

  await program.rpc.updateGif("https://media.giphy.com/media/qtyUiCUuk0Sgh2YwdL/giphy.gif", {
    accounts: {
      baseAccount: baseAccount.publicKey
    }
  })

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF 0 votes', account.gifList[0].votes)

  const tipReceiver = "Ft9Enm484R3Yy4mzxgAfPxkYcEanCkbTtReqEPnQedDH";

  await program.rpc.sendTip(new anchor.BN(10000000), {
    accounts: {
      from: provider.wallet.publicKey,
      to: tipReceiver,
      systemProgram: SystemProgram.programId
    }
  })
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runMain();