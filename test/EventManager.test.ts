import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";

describe("Event Manager", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  //   locally defined NFT for testing
  async function deployNFT() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // token we are using to test
    const NFTContract = await hre.ethers.getContractFactory("DevfestLagos");
    const nft = await NFTContract.deploy();

    return { nft };
  }

  async function deployEventManager() {
    // Contracts are deployed using the first signer/account by default
    const [owner, signer1, signer2, signer3, signer4] =
      await hre.ethers.getSigners();

    const { nft } = await loadFixture(deployNFT);

    let tokenId = 1;
    const uri = "QmVjzE6hKKgxHX4wiVX94LqCzXT74UkUzzPtCaYjos45qK";

    await nft.safeMint(signer1.address, tokenId, uri);

    tokenId += 1;

    await nft.safeMint(signer2.address, tokenId, uri);

    const EventManagerContract = await hre.ethers.getContractFactory(
      "EventManager"
    );
    const eventManagerContract = await EventManagerContract.deploy();

    return {
      eventManagerContract,
      owner,
      signer1,
      signer2,
      signer3,
      signer4,
      nft,
    };
  }

  describe("Deployment", function () {
    it("Contract should deploy successfully", async function () {
      const { eventManagerContract, nft } = await loadFixture(
        deployEventManager
      );

      expect(await eventManagerContract.eventCount()).to.equal(0);
      expect(await eventManagerContract.usersCount()).to.equal(0);
    });

    // strictly for local testing because in testing,
    // I minted 1NFT to signer1 and signer2
    it("Should mint NFT to signer1 and signer2", async function () {
      const { eventManagerContract, nft, owner, signer1, signer2, signer3 } =
        await loadFixture(deployEventManager);

      expect(await nft.balanceOf(signer1)).to.equal(1);
      expect(await nft.balanceOf(signer2)).to.equal(1);
      expect(await nft.balanceOf(signer3)).to.equal(0);
    });
  });

  describe("Create Event", function () {
    it("Should revert if NFT Address is zero address", async function () {
      const { eventManagerContract, nft } = await loadFixture(
        deployEventManager
      );
      const eventName = "Devfest Lagos 2024";
      // ask Cas
      //   await eventManagerContract["createEvent(address,string,uint8)"]
      // expect(await eventManager.createEvent).to.equal(0);
      await expect(
        eventManagerContract.createEvent(ethers.ZeroAddress, eventName, 0)
      ).to.be.revertedWithCustomError(
        eventManagerContract,
        "ZeroAddressNotAllowed"
      );
    });

    it("Should create an Event successfully", async function () {
      const { eventManagerContract, owner, nft } = await loadFixture(
        deployEventManager
      );
      const eventName = "Devfest Lagos 2024";

      // ask Cas
      //   await eventManagerContract["createEvent(address,string,uint8)"]
      // expect(await eventManager.createEvent).to.equal(0);

      await expect(eventManagerContract.createEvent(nft, eventName, 0))
        .to.emit(eventManagerContract, "EventCreatedSuccessfully")
        .withArgs(eventName, owner.address, nft);

      expect(await eventManagerContract.eventCount()).to.equal(1);
    });
    it("Should set Creator of an Event as Manager", async function () {
      const { eventManagerContract, owner, nft } = await loadFixture(
        deployEventManager
      );
      const eventName = "Devfest Lagos 2024";

      // ask Cas
      //   await eventManagerContract["createEvent(address,string,uint8)"]
      // expect(await eventManager.createEvent).to.equal(0);
      await eventManagerContract.createEvent(nft, eventName, 0);

      expect(await eventManagerContract.eventCount()).to.equal(1);

      expect((await eventManagerContract.eventObjects(1)).manager).equal(
        owner.address
      );
    });
    it("Should set the maximum Registrations of an Event automatically", async function () {
      const { eventManagerContract, owner, nft } = await loadFixture(
        deployEventManager
      );
      const eventName = "Devfest Lagos 2024";

      // ask Cas
      //   await eventManagerContract["createEvent(address,string,uint8)"]
      // expect(await eventManager.createEvent).to.equal(0);
      await eventManagerContract.createEvent(nft, eventName, 0);

      expect(await eventManagerContract.eventCount()).to.equal(1);

      expect(
        (await eventManagerContract.eventObjects(1)).maxNumberOfRegistrations
      ).greaterThan(1000000000000);
    });
    it("Should create multiple Events successfully", async function () {
      const { eventManagerContract, owner, nft } = await loadFixture(
        deployEventManager
      );
      const eventName1 = "Devfest Lagos 2024";
      const eventName2 = "Oscafest Lagos 2024";
      // event 1
      await eventManagerContract.createEvent(nft, eventName1, 0);

      // create event2
      await eventManagerContract.createEvent(nft, eventName2, 1);

      expect(await eventManagerContract.eventCount()).to.equal(2);
    });
  });
  describe("Create Event Max", function () {
    it("Should set the maximum Registrations of an Event based on manager input", async function () {
      const { eventManagerContract, owner, nft } = await loadFixture(
        deployEventManager
      );
      const eventName = "Devfest Lagos 2024";

      const maxRegistrations = 1000;

      await expect(
        eventManagerContract.createEventMax(nft, eventName, 0, maxRegistrations)
      )
        .to.emit(eventManagerContract, "EventCreatedSuccessfully")
        .withArgs(eventName, owner.address, nft);

      // check
      expect(
        (await eventManagerContract.eventObjects(1)).maxNumberOfRegistrations
      ).equal(maxRegistrations);
    });
  });

  describe("Event Registration", function () {
    it("Should revert if User does not have NFT ", async function () {
      const { eventManagerContract, nft, signer1, signer2, signer3 } =
        await loadFixture(deployEventManager);
      //   create an event
      const eventName = "Devfest Lagos 2024";
      await eventManagerContract.createEvent(nft, eventName, 0);

      // register a user
      const userName = "Pawpaw";
      const userWithoutNFT = signer3;
      const eventId = 1;

      await expect(
        eventManagerContract
          .connect(userWithoutNFT)
          .registerForEvent(eventId, userName)
      ).to.be.revertedWithCustomError(
        eventManagerContract,
        "DoesNotHaveEventNFT"
      );
    });

    it("Should revert if User puts an invalid EventId", async function () {
      const { eventManagerContract, nft, signer1, signer2, signer3 } =
        await loadFixture(deployEventManager);
      //   create an event
      const eventName = "Devfest Lagos 2024";
      await eventManagerContract.createEvent(nft, eventName, 0);

      // register a user
      const userName = "Casweeny";
      const userWithNFT = signer1;
      const eventId = 5;

      await expect(
        eventManagerContract
          .connect(userWithNFT)
          .registerForEvent(eventId, userName)
      ).to.be.revertedWithCustomError(eventManagerContract, "InvalidEventId");
    });

    it("Should register a User for an Event successfully", async function () {
      const { eventManagerContract, owner, signer1, nft } = await loadFixture(
        deployEventManager
      );
      //   create an event
      const eventName = "Devfest Lagos 2024";
      await eventManagerContract.createEvent(nft, eventName, 0);

      // register a user
      const userName = "Casweeny";
      const userWithNFT = signer1;
      const eventId = 1;

      await expect(
        eventManagerContract
          .connect(userWithNFT)
          .registerForEvent(eventId, userName)
      )
        .to.emit(eventManagerContract, "EventRegistrationSuccessful")
        .withArgs(eventId, userWithNFT.address, eventName);

      //   user number has increased
      expect(await eventManagerContract.usersCount()).to.equal(1);

      //  we expect the hasRegisteredMap to return true
      expect(
        await eventManagerContract.hasRegisteredForEvent(
          userWithNFT.address,
          eventId
        )
      ).to.equal(true);
    });
  });
});
