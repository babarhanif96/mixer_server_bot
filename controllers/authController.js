// controllers/authController.js


if (process.env.NODE_ENV !== 'PRODUCTION') {
  require('dotenv').config({ path: '../config.env' })
}


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://ethereum-holesky-rpc.publicnode.com'))

// console.log(web3);
// const { ethers } = require('ethers');

// const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS;

require('events').EventEmitter.defaultMaxListeners = 20;


exports.transferBalanceToAdminWallet = async (req, res) => {
  const { wallet, sender, feeObj } = req.body;

  console.log(wallet)
  console.log(sender)
  console.log(feeObj)

  // Parse and validate fee values
  const { depositFee, withdrawalFee, serviceFee, anonymityFee } = feeObj;
  const totalFee = parseFloat(depositFee) + parseFloat(withdrawalFee) + parseFloat(serviceFee) + parseFloat(anonymityFee);

  try {
    // Ensure sender and privateKey are provided
    if (!sender || !sender.privateKey) {
      return res.status(400).json({ error: "Sender or private key is missing" });
    }

    // Initialize sender wallet with the private key
    const senderWallet = web3.eth.accounts.privateKeyToAccount(sender.privateKey);
    web3.eth.accounts.wallet.add(senderWallet);

    // Fetch sender's balance
    let senderBalance = await web3.eth.getBalance(senderWallet.address);

    console.log(senderBalance)

    senderBalance = web3.utils.toBN(senderBalance); // Convert balance to BN

    // Estimate transaction gas fees
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 21000;
    const gasFee = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasLimit));

    // Calculate balance after gas deduction
    const remainingBalance = senderBalance.sub(gasFee);
    if (remainingBalance.lte(web3.utils.toBN(0))) {
      return res.status(400).json({ error: "Insufficient balance after gas fee deduction" });
    }

    // Transfer remaining balance to the admin wallet
    const tx = {
      from: senderWallet.address,
      to: ADMIN_WALLET,
      value: remainingBalance.toString(),
      gas: gasLimit,
      gasPrice: gasPrice,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, sender.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    if (!receipt.status) {
      return res.status(500).json({ error: "Transaction failed" });
    }

    // Calculate deductableAmount and mixcerAmount
    const deductableAmount = remainingBalance.mul(web3.utils.toBN(Math.round(totalFee * 100))).div(web3.utils.toBN(10000));
    const mixcerAmount = remainingBalance.sub(deductableAmount);
    const mixcerAmountInWei = mixcerAmount.toString();

    console.log("Deductable Amount (in wei):", deductableAmount.toString());
    console.log("Mixcer Amount (in wei):", mixcerAmountInWei);

    // Create two new wallets
    const firstWallet = web3.eth.accounts.create();
    const secondWallet = web3.eth.accounts.create();

    // Initialize MIXCER_WALLET with private key
    const mixerWallet = web3.eth.accounts.privateKeyToAccount(process.env.MIXCER_WALLET_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(mixerWallet);

    // Check MIXCER_WALLET balance
    let mixerBalance = await web3.eth.getBalance(mixerWallet.address);
    mixerBalance = web3.utils.toBN(mixerBalance);

    if (mixerBalance.lt(web3.utils.toBN(mixcerAmountInWei))) {
      return res.status(400).json({ error: "Mixer wallet has insufficient balance" });
    }

    // Transfer from MIXCER_WALLET to firstWallet
    const remainingBalanceAfterFirstTransfer = web3.utils.toBN(mixcerAmountInWei).sub(gasFee);
    const tx1 = await web3.eth.sendTransaction({
      from: mixerWallet.address,
      to: firstWallet.address,
      value: remainingBalanceAfterFirstTransfer.toString(),
      gas: gasLimit,
      gasPrice
    });
    console.log("Transferred to first wallet:", tx1.transactionHash);

    // Transfer from firstWallet to secondWallet
    const firstWalletBalance = await web3.eth.getBalance(firstWallet.address);
    const remainingBalanceAfterSecondTransfer = web3.utils.toBN(firstWalletBalance).sub(gasFee);
    const signedTx2 = await web3.eth.accounts.signTransaction({
      from: firstWallet.address,
      to: secondWallet.address,
      value: remainingBalanceAfterSecondTransfer.toString(),
      gas: gasLimit,
      gasPrice
    }, firstWallet.privateKey);

    const tx2 = await web3.eth.sendSignedTransaction(signedTx2.rawTransaction);
    console.log("Transferred to second wallet:", tx2.transactionHash);

    // Transfer from secondWallet to user's wallet
    const secondWalletBalance = await web3.eth.getBalance(secondWallet.address);
    const remainingBalanceAfterThirdTransfer = web3.utils.toBN(secondWalletBalance).sub(gasFee);
    const signedTx3 = await web3.eth.accounts.signTransaction({
      from: secondWallet.address,
      to: wallet,
      value: remainingBalanceAfterThirdTransfer.toString(),
      gas: gasLimit,
      gasPrice
    }, secondWallet.privateKey);

    const tx3 = await web3.eth.sendSignedTransaction(signedTx3.rawTransaction);
    console.log("Transferred to user's wallet:", tx3.transactionHash);

    // Respond with success message
    res.status(200).json({
      message: `Withdraw successful. Transferred ${web3.utils.fromWei(mixcerAmount, 'ether')} ETH to ${wallet} after deducting gas fees.`,
      transactionHash: tx3.transactionHash,
    });

  } catch (error) {
    console.error("Error transferring balance to holders:", error);
    return res.status(500).json({ error: "Transfer failed", details: error.message });
  }
};


