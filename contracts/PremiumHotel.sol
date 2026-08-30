// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PremiumHotel
 * @notice Decentralized Hotel Reservation Smart Contract with Role-Based Access Control,
 * Dynamic Room Management, Multi-Receptionist Support, and Custom Financial Withdrawals.
 */
contract PremiumHotel {

    // ==========================================
    // 1. Roles & Core State Variables
    // ==========================================
    
    address public owner;
    uint256 public totalRooms;

    // Multi-receptionist management
    mapping(address => bool) public isReceptionist;
    address[] public receptionistsList;

    // Room Statuses: 0 = Available, 1 = Booked (50% deposit), 2 = PaidWaitingForKey (100% paid), 3 = CheckedIn
    enum RoomStatus { Available, Booked, PaidWaitingForKey, CheckedIn }

    // Detailed Room Structure
    struct Room {
        uint256 id;
        uint256 price;          // Price in Wei
        RoomStatus status;
        address occupant;       // Guest address (address(0) if available)
        uint256 bookingTime;    // Timestamp when booked
        string name;            // e.g. "Deluxe Ocean Suite"
        string roomType;        // e.g. "Deluxe", "Suite", "Standard", "Penthouse"
        string imageUrl;        // Image URL / IPFS hash
        bool isActive;          // Soft-delete / maintenance flag
    }

    mapping(uint256 => Room) public rooms;

    // ==========================================
    // 2. Events
    // ==========================================

    event RoomBooked(uint256 indexed roomId, address indexed occupant, uint256 deposit);
    event ReservationCancelled(uint256 indexed roomId, address indexed occupant, uint256 refundAmount);
    event RemainingPaid(uint256 indexed roomId, address indexed occupant, uint256 remainingAmount);
    event CheckedIn(uint256 indexed roomId, address indexed receptionist, address indexed occupant);
    event CheckedOut(uint256 indexed roomId, address indexed receptionist);
    
    event RoomAdded(uint256 indexed roomId, string name, uint256 price, string roomType);
    event RoomUpdated(uint256 indexed roomId, uint256 price, string name, string roomType, bool isActive);
    event RoomPriceUpdated(uint256 indexed roomId, uint256 oldPrice, uint256 newPrice);
    
    event ReceptionistAdded(address indexed receptionist);
    event ReceptionistRemoved(address indexed receptionist);
    event FundsWithdrawn(address indexed owner, uint256 amount, uint256 remainingContractBalance);

    // ==========================================
    // 3. Modifiers
    // ==========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Error: Only Owner can perform this action");
        _;
    }

    modifier onlyReceptionist() {
        require(isReceptionist[msg.sender] || msg.sender == owner, "Error: Only Receptionist or Owner can perform this");
        _;
    }

    // ==========================================
    // 4. Constructor
    // ==========================================
    
    constructor() {
        owner = msg.sender;
        
        // Add deployer as default receptionist as well for easy testing
        isReceptionist[msg.sender] = true;
        receptionistsList.push(msg.sender);

        // Pre-create initial luxury rooms
        _createRoom(0.05 ether, "Ocean View Deluxe", "Deluxe", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80");
        _createRoom(0.08 ether, "Executive Sky Suite", "Suite", "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80");
        _createRoom(0.12 ether, "Presidential Royal Villa", "Penthouse", "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80");
    }

    function _createRoom(
        uint256 _price,
        string memory _name,
        string memory _roomType,
        string memory _imageUrl
    ) internal {
        totalRooms++;
        rooms[totalRooms] = Room({
            id: totalRooms,
            price: _price,
            status: RoomStatus.Available,
            occupant: address(0),
            bookingTime: 0,
            name: _name,
            roomType: _roomType,
            imageUrl: _imageUrl,
            isActive: true
        });
        emit RoomAdded(totalRooms, _name, _price, _roomType);
    }

    // ==========================================
    // 5. Customer Functions (Guests)
    // ==========================================
    
    /// @notice Book a room by depositing exactly 50% of the total price
    function bookRoom(uint256 _roomId) public payable {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.isActive, "Room is currently deactivated for maintenance");
        require(room.status == RoomStatus.Available, "Room is not available for booking");
        require(msg.value == room.price / 2, "Must pay exactly 50% deposit");

        room.status = RoomStatus.Booked;
        room.occupant = msg.sender;
        room.bookingTime = block.timestamp;

        emit RoomBooked(_roomId, msg.sender, msg.value);
    }

    /// @notice Cancel booking. If cancelled within 24h, deposit is refunded.
    function cancelReservation(uint256 _roomId) public {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.Booked, "Room is not in booked status");
        require(msg.sender == room.occupant || msg.sender == owner, "Only occupant or owner can cancel");

        uint256 refund = 0;
        if (block.timestamp <= room.bookingTime + 1 days) {
            refund = room.price / 2;
            (bool success, ) = payable(room.occupant).call{value: refund}("");
            require(success, "Refund transfer failed");
        }

        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;

        emit ReservationCancelled(_roomId, msg.sender, refund);
    }

    /// @notice Pay remaining 50% balance before check-in
    function payRemaining(uint256 _roomId) public payable {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.Booked, "Room is not in Booked status");
        require(msg.sender == room.occupant, "Only occupant can pay remaining balance");
        require(msg.value == room.price / 2, "Must pay remaining 50%");

        room.status = RoomStatus.PaidWaitingForKey;
        emit RemainingPaid(_roomId, msg.sender, msg.value);
    }

    // ==========================================
    // 6. Receptionist Functions (Front Desk)
    // ==========================================

    /// @notice Confirm key handover and guest check-in
    function confirmCheckIn(uint256 _roomId) public onlyReceptionist {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.PaidWaitingForKey, "Guest has not paid in full yet");
        room.status = RoomStatus.CheckedIn;

        emit CheckedIn(_roomId, msg.sender, room.occupant);
    }

    /// @notice Confirm key return and guest check-out
    function checkoutRoom(uint256 _roomId) public onlyReceptionist {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.CheckedIn, "Room is not currently checked in");
        
        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;

        emit CheckedOut(_roomId, msg.sender);
    }

    // ==========================================
    // 7. Owner Functions (Hotel Management)
    // ==========================================

    /// @notice Add a brand new room to the hotel
    function addRoom(
        uint256 _price,
        string memory _name,
        string memory _roomType,
        string memory _imageUrl
    ) public onlyOwner {
        require(_price > 0, "Price must be greater than 0");
        _createRoom(_price, _name, _roomType, _imageUrl);
    }

    /// @notice Update price of an existing available room
    function updateRoomPrice(uint256 _roomId, uint256 _newPrice) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        require(_newPrice > 0, "Price must be greater than 0");
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Available, "Cannot change price of an occupied room");

        uint256 oldPrice = room.price;
        room.price = _newPrice;
        emit RoomPriceUpdated(_roomId, oldPrice, _newPrice);
    }

    /// @notice Update room metadata details
    function updateRoomDetails(
        uint256 _roomId,
        string memory _name,
        string memory _roomType,
        string memory _imageUrl
    ) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        room.name = _name;
        room.roomType = _roomType;
        room.imageUrl = _imageUrl;
        emit RoomUpdated(_roomId, room.price, _name, _roomType, room.isActive);
    }

    /// @notice Toggle room active status (soft-delete / maintenance mode)
    function toggleRoomActive(uint256 _roomId) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Available, "Cannot toggle status of active booking");
        
        room.isActive = !room.isActive;
        emit RoomUpdated(_roomId, room.price, room.name, room.roomType, room.isActive);
    }

    /// @notice Emergency reset if guest no-shows or system needs manual override
    function forceResetRoom(uint256 _roomId, bool _refundOccupant) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];

        if (_refundOccupant && room.occupant != address(0)) {
            uint256 refundAmount = room.status == RoomStatus.PaidWaitingForKey ? room.price : (room.price / 2);
            if (address(this).balance >= refundAmount) {
                payable(room.occupant).transfer(refundAmount);
            }
        }

        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
    }

    // ── Multi-Receptionist Management ───────────────

    function addReceptionist(address _receptionist) public onlyOwner {
        require(_receptionist != address(0), "Invalid address");
        require(!isReceptionist[_receptionist], "Address is already a receptionist");
        
        isReceptionist[_receptionist] = true;
        receptionistsList.push(_receptionist);
        emit ReceptionistAdded(_receptionist);
    }

    function removeReceptionist(address _receptionist) public onlyOwner {
        require(isReceptionist[_receptionist], "Address is not a receptionist");
        isReceptionist[_receptionist] = false;

        // Remove from dynamic array
        for (uint256 i = 0; i < receptionistsList.length; i++) {
            if (receptionistsList[i] == _receptionist) {
                receptionistsList[i] = receptionistsList[receptionistsList.length - 1];
                receptionistsList.pop();
                break;
            }
        }
        emit ReceptionistRemoved(_receptionist);
    }

    function getReceptionists() public view returns (address[] memory) {
        return receptionistsList;
    }

    // ── Financial Withdrawals ────────────────────────

    /// @notice Withdraw custom amount in Wei
    function withdrawCustom(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner, _amount, address(this).balance);
    }

    /// @notice Withdraw 100% full balance
    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner, balance, 0);
    }

    // ==========================================
    // 8. Read View Functions
    // ==========================================

    function getRoomDetails(uint256 _roomId) public view returns (Room memory) {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        return rooms[_roomId];
    }

    function getAllRooms() public view returns (Room[] memory) {
        Room[] memory allRooms = new Room[](totalRooms);
        for (uint256 i = 1; i <= totalRooms; i++) {
            allRooms[i - 1] = rooms[i];
        }
        return allRooms;
    }

    receive() external payable {}
}
