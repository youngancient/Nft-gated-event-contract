import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventManagerModule = buildModule("EventManagerModule", (m) => {
  const eventManager = m.contract("EventManager");

  return { eventManager };
});

export default EventManagerModule;
