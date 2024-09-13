# Sample Hardhat Project

This project is an NFT gated event smart contract which allows event managers to create events assigning each event an NFT (unique to each event or not) and every attendee registering must possess the NFT to register for the event.

Try running some of the following tasks:

```shell
git clone https://github.com/youngancient/Nft-gated-event-contract.git

npm install

npx hardhat compile

npx hardhat test

REPORT_GAS=true npx hardhat test

npx hardhat node
npx hardhat ignition deploy ./ignition/modules/EventManager.ts
```
