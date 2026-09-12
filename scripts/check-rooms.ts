import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const addr = "0x913D2b64f5b0117341546F13071d2326c2352a5b";
  console.log("Checking contract at:", addr);
  const hotel = await ethers.getContractAt("PremiumHotel", addr);
  const rooms = await hotel.getAllRooms();
  console.log("Total rooms:", rooms.length);
  rooms.forEach((r, idx) => {
    console.log(`Room #${r.id} (${r.name}): status=${r.status} occupant=${r.occupant} pricePerNight=${ethers.formatEther(r.pricePerNight)} totalPrice=${ethers.formatEther(r.totalPrice)}`);
  });
}

main().catch(console.error);
