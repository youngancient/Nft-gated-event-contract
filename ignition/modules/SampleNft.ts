import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NftModule = buildModule("NftModule", (m) => {
  const nft = m.contract("NftModule");

  return { nft };
});

export default NftModule;
