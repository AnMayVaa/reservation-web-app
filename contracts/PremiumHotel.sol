// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PremiumHotel v3
 * @notice Decentralized Hotel Reservation Smart Contract featuring:
 *  - Date/Time based reservations (Check-in & Check-out timestamps)
 *  - Dynamic pricing based on number of nights
 *  - 2-Step payment (50% deposit + 50% balance)
 *  - 24-Hour cancellation refund guarantee
 *  - Guest Self-Checkout & Auto-Expiry reset
 *  - Contactless IoT Digital Door Lock compatibility (EIP-191 / TOTP off-chain verification)
 *  - Multi-receptionist management & custom owner withdrawals
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

    // Detailed Room Structure with Date/Time Support
    struct Room {
        uint256 id;
        uint256 pricePerNight;  // Price per 24-hour night in Wei
        uint256 totalPrice;     // Total booking price for current reservation in Wei
        RoomStatus status;
        address occupant;       // Guest address (address(0) if available)
        uint256 bookingTime;    // Timestamp when booking transaction occurred
        uint256 checkInTime;    // Scheduled check-in timestamp
        uint256 checkOutTime;   // Scheduled check-out timestamp
        string name;            // e.g. "Deluxe Ocean Suite"
        string roomType;        // e.g. "Deluxe", "Suite", "Standard", "Penthouse"
        string imageUrl;        // Image URL
        bool isActive;          // Soft-delete / maintenance flag
    }

    mapping(uint256 => Room) public rooms;

    // ==========================================
    // 2. Events
    // ==========================================

    event RoomBooked(
        uint256 indexed roomId,
        address indexed occupant,
        uint256 deposit,
        uint256 checkInTime,
        uint256 checkOutTime,
        uint256 nights
    );
    event ReservationCancelled(uint256 indexed roomId, address indexed occupant, uint256 refundAmount);
    event RemainingPaid(uint256 indexed roomId, address indexed occupant, uint256 remainingAmount);
    event CheckedIn(uint256 indexed roomId, address indexed operator, address indexed occupant);
    event CheckedOut(uint256 indexed roomId, address indexed operator);
    event BookingExpired(uint256 indexed roomId, address indexed resetBy);
    
    event RoomAdded(uint256 indexed roomId, string name, uint256 pricePerNight, string roomType);
    event RoomUpdated(uint256 indexed roomId, uint256 pricePerNight, string name, string roomType, bool isActive);
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

    modifier onlyStaffOrOccupant(uint256 _roomId) {
        require(
            msg.sender == rooms[_roomId].occupant ||
            isReceptionist[msg.sender] ||
            msg.sender == owner,
            "Error: Unauthorized caller"
        );
        _;
    }

    // ==========================================
    // 4. Constructor
    // ==========================================
    
    constructor() {
        owner = msg.sender;
        
        // Add deployer as default receptionist as well
        isReceptionist[msg.sender] = true;
        receptionistsList.push(msg.sender);

        // Pre-create initial luxury rooms with per-night rates
        _createRoom(0.02 ether, "Ocean View Deluxe", "Deluxe", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80");
        _createRoom(0.04 ether, "Executive Sky Suite", "Suite", "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80");
        _createRoom(0.06 ether, "Presidential Royal Villa", "Penthouse", "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80");
    }

    function _createRoom(
        uint256 _pricePerNight,
        string memory _name,
        string memory _roomType,
        string memory _imageUrl
    ) internal {
        totalRooms++;
        rooms[totalRooms] = Room({
            id: totalRooms,
            pricePerNight: _pricePerNight,
            totalPrice: 0,
            status: RoomStatus.Available,
            occupant: address(0),
            bookingTime: 0,
            checkInTime: 0,
            checkOutTime: 0,
            name: _name,
            roomType: _roomType,
            imageUrl: _imageUrl,
            isActive: true
        });
        emit RoomAdded(totalRooms, _name, _pricePerNight, _roomType);
    }

    // ==========================================
    // 5. Customer Functions (Guests & Bookings)
    // ==========================================
    
    /// @notice Book a room for a specific check-in and check-out date/time range
    /// @param _roomId Room ID to book
    /// @param _checkInTime Unix timestamp of check-in
    /// @param _checkOutTime Unix timestamp of check-out
    function bookRoom(
        uint256 _roomId,
        uint256 _checkInTime,
        uint256 _checkOutTime
    ) public payable {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.isActive, "Room is currently deactivated for maintenance");
        require(room.status == RoomStatus.Available, "Room is not available for booking");
        require(_checkInTime >= block.timestamp - 600, "Check-in time cannot be in the past");
        require(_checkOutTime > _checkInTime, "Check-out time must be after check-in");

        // Calculate nights (ceiling division, minimum 1 night)
        uint256 duration = _checkOutTime - _checkInTime;
        uint256 nights = (duration + 86399) / 86400;
        if (nights == 0) nights = 1;

        uint256 totalCost = nights * room.pricePerNight;
        uint256 depositRequired = totalCost / 2;
        require(msg.value == depositRequired, "Must pay exactly 50% deposit of total booking price");

        room.totalPrice = totalCost;
        room.status = RoomStatus.Booked;
        room.occupant = msg.sender;
        room.bookingTime = block.timestamp;
        room.checkInTime = _checkInTime;
        room.checkOutTime = _checkOutTime;

        emit RoomBooked(_roomId, msg.sender, msg.value, _checkInTime, _checkOutTime, nights);
    }

    /// @notice Cancel booking. If cancelled within 24h, 50% deposit is refunded.
    function cancelReservation(uint256 _roomId) public {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.Booked, "Room is not in booked status");
        require(msg.sender == room.occupant || msg.sender == owner, "Only occupant or owner can cancel");

        uint256 refund = 0;
        if (block.timestamp <= room.bookingTime + 1 days) {
            refund = room.totalPrice / 2;
            (bool success, ) = payable(room.occupant).call{value: refund}("");
            require(success, "Refund transfer failed");
        }

        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
        room.checkInTime = 0;
        room.checkOutTime = 0;
        room.totalPrice = 0;

        emit ReservationCancelled(_roomId, msg.sender, refund);
    }

    /// @notice Pay remaining 50% balance before check-in
    function payRemaining(uint256 _roomId) public payable {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        
        require(room.status == RoomStatus.Booked, "Room is not in Booked status");
        require(msg.sender == room.occupant, "Only occupant can pay remaining balance");
        
        uint256 remainingRequired = room.totalPrice - (room.totalPrice / 2);
        require(msg.value == remainingRequired, "Must pay the remaining 50% balance");

        room.status = RoomStatus.PaidWaitingForKey;
        emit RemainingPaid(_roomId, msg.sender, msg.value);
    }

    /// @notice Guest check-out / room release (callable by occupant or staff)
    function checkoutRoom(uint256 _roomId) public onlyStaffOrOccupant(_roomId) {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        require(
            room.status == RoomStatus.CheckedIn || room.status == RoomStatus.PaidWaitingForKey,
            "Room is not in checked in or paid status"
        );
        
        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
        room.checkInTime = 0;
        room.checkOutTime = 0;
        room.totalPrice = 0;

        emit CheckedOut(_roomId, msg.sender);
    }

    /// @notice Anyone or staff can expire/reset a room if the checkOutTime has elapsed
    function expireBooking(uint256 _roomId) public {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        require(room.status != RoomStatus.Available, "Room is already available");
        require(room.checkOutTime > 0 && block.timestamp > room.checkOutTime, "Booking has not yet expired");

        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
        room.checkInTime = 0;
        room.checkOutTime = 0;
        room.totalPrice = 0;

        emit BookingExpired(_roomId, msg.sender);
    }

    /// @notice Confirm check-in on-chain (optional, since digital key handles verification off-chain)
    function confirmCheckIn(uint256 _roomId) public {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        require(
            msg.sender == room.occupant || isReceptionist[msg.sender] || msg.sender == owner,
            "Unauthorized"
        );
        require(room.status == RoomStatus.PaidWaitingForKey, "Must be paid in full");

        room.status = RoomStatus.CheckedIn;
        emit CheckedIn(_roomId, msg.sender, room.occupant);
    }

    // ==========================================
    // 6. Owner Functions (Hotel Management)
    // ==========================================

    function addRoom(
        uint256 _pricePerNight,
        string memory _name,
        string memory _roomType,
        string memory _imageUrl
    ) public onlyOwner {
        require(_pricePerNight > 0, "Price must be greater than 0");
        _createRoom(_pricePerNight, _name, _roomType, _imageUrl);
    }

    function updateRoomPrice(uint256 _roomId, uint256 _newPricePerNight) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        require(_newPricePerNight > 0, "Price must be greater than 0");
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Available, "Cannot change price of an occupied room");

        uint256 oldPrice = room.pricePerNight;
        room.pricePerNight = _newPricePerNight;
        emit RoomPriceUpdated(_roomId, oldPrice, _newPricePerNight);
    }

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
        emit RoomUpdated(_roomId, room.pricePerNight, _name, _roomType, room.isActive);
    }

    function toggleRoomActive(uint256 _roomId) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];
        require(room.status == RoomStatus.Available, "Cannot toggle status of active booking");
        
        room.isActive = !room.isActive;
        emit RoomUpdated(_roomId, room.pricePerNight, room.name, room.roomType, room.isActive);
    }

    function forceResetRoom(uint256 _roomId, bool _refundOccupant) public onlyOwner {
        require(_roomId > 0 && _roomId <= totalRooms, "Invalid room ID");
        Room storage room = rooms[_roomId];

        if (_refundOccupant && room.occupant != address(0)) {
            uint256 refundAmount = room.status == RoomStatus.PaidWaitingForKey ? room.totalPrice : (room.totalPrice / 2);
            if (address(this).balance >= refundAmount && refundAmount > 0) {
                payable(room.occupant).transfer(refundAmount);
            }
        }

        room.status = RoomStatus.Available;
        room.occupant = address(0);
        room.bookingTime = 0;
        room.checkInTime = 0;
        room.checkOutTime = 0;
        room.totalPrice = 0;
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

    function withdrawCustom(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner, _amount, address(this).balance);
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner, balance, 0);
    }

    // ==========================================
    // 7. Read View Functions (Free via eth_call)
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
