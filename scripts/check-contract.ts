import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const addr = "0x435e26dfB8faeB30fdDEf888aeba681E130D8014";
  console.log("Checking contract at:", addr);
  try {
    const hotel = await ethers.getContractAt("PremiumHotel", addr);
    const owner = await hotel.owner();
    console.log("Owner:", owner);
    const total = await hotel.totalRooms();
    console.log("Total rooms:", total.toString());
    const rooms = await hotel.getAllRooms();
    console.log("Rooms count:", rooms.length);
    console.log("Room 1:", rooms[0]);
    const receps = await hotel.getReceptionists();
    console.log("Receptionists:", receps);
  } catch (e) {
    console.error("Error calling contract:", e);
  }
}

main().catch(console.error);
