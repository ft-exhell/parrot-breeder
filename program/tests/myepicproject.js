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

  await program.rpc.addGif({
    accounts: {
      baseAccount: baseAccount.publicKey
    }
  })

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log(`GIF count: ${account.totalGifs.toString()}`);
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