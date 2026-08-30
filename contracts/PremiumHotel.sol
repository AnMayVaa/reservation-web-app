// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PremiumHotel {
    
    // ==========================================
    // 1. การจัดการสิทธิ์และตัวแปรหลัก (Roles & Variables)
    // ==========================================
    
    address public owner;
    address public receptionist;
    uint256 public totalRooms;

    enum RoomStatus { Available, Booked, PaidWaitingForKey, CheckedIn }

    struct Room {
        uint256 id;
        uint256 price;
        RoomStatus status;
        address occupant;
        uint256 bookingTime;
    }

    mapping(uint256 => Room) public rooms;

    // ==========================================
    // 2. ตัวกรองสิทธิ์การใช้งาน (Modifiers)
    // ==========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Error: Only Owner can do this!");
        _;
    }

    modifier onlyReceptionist() {
        require(msg.sender == receptionist, "Error: Only Receptionist can confirm!");
        _;
    }

    // ==========================================
    // 3. การตั้งค่าเริ่มต้น (Constructor)
    // ==========================================
    
    constructor() {
        owner = msg.sender;
        totalRooms = 2;
        rooms[1] = Room(1, 0.1 ether, RoomStatus.Available, address(0), 0);
        rooms[2] = Room(2, 0.1 ether, RoomStatus.Available, address(0), 0);
    }

    // ==========================================
    // 4. ส่วนการทำงานของลูกค้า (Customer Functions)
    // ==========================================
    
    function bookRoom(uint256 _roomId) public payable {
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Available, "Room is not available");
        require(msg.value == room.price / 2, "Must pay exactly 50% deposit");
        room.status = RoomStatus.Booked;
        room.occupant = msg.sender;
        room.bookingTime = block.timestamp;
    }

    function cancelReservation(uint256 _roomId) public {
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Booked, "Room is not booked");
        require(msg.sender == room.occupant, "Only occupant can cancel");
        if (block.timestamp <= room.bookingTime + 1 days) {
            payable(msg.sender).transfer(room.price / 2);
        }
        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
    }

    function payRemaining(uint256 _roomId) public payable {
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Booked, "Room is not in Booked status");
        require(msg.sender == room.occupant, "Only occupant can pay");
        require(msg.value == room.price / 2, "Must pay the remaining 50%");
        room.status = RoomStatus.PaidWaitingForKey;
    }

    // ==========================================
    // 5. ส่วนการทำงานของโรงแรม (Admin & Reception Functions)
    // ==========================================

    function setReceptionist(address _receptionist) public onlyOwner {
        receptionist = _receptionist;
    }

    function confirmCheckIn(uint256 _roomId) public onlyReceptionist {
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.PaidWaitingForKey, "Customer has not paid in full yet");
        room.status = RoomStatus.CheckedIn;
    }

    function checkoutRoom(uint256 _roomId) public onlyReceptionist {
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.CheckedIn, "Room is not checked in yet");
        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
    }

    function withdrawFunds() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // ==========================================
    // 6. ส่วนแสดงผลข้อมูล (Read Data)
    // ==========================================

    function getRoomDetails(uint256 _roomId) public view returns (Room memory) {
        return rooms[_roomId];
    }

    function getAllRooms() public view returns (Room[] memory) {
        Room[] memory allRooms = new Room[](totalRooms);
        for (uint256 i = 1; i <= totalRooms; i++) {
            allRooms[i - 1] = rooms[i];
        }
        return allRooms;
    }
}
