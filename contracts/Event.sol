// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Errors, Events} from "./Utils.sol";

contract EventManager {
    enum EventType {
        Conference,
        Workshop,
        Seminar,
        Hackathon
    }

    uint256 public eventCount;

    struct EventObj {
        uint256 id;
        bool isDone;
        bool hasCanceled;
        address manager;
        address nftAddress;
        string eventName;
        uint256 dateCreated;
        EventType eventType;
        uint256 numberOfRegisteredPersons;
        uint256 maxNumberOfRegistrations;
        uint256 numberOfAttendees;
        address[] registeredPersons;
    }
    EventObj[] allEvents;

    uint256 public usersCount;

    mapping(uint => EventObj) eventObjects;
    // hasRegistered[userAddress][eventId] -> bool
    mapping(address => mapping(uint => bool)) hasRegisteredForEvent;
    mapping(address => mapping(uint => bool)) hasAttendedEvent;

    // not important, just for better user experience
    struct User {
        uint256 id;
        string name;
        uint256[] registeredEventIds;
        uint256[] attendedEventIds;
    }
    // keeps track of all users
    User[] public users;
    mapping(address => User) userObj;

    // internal functions

    function _sanityCheck(address _user) private pure {
        if (_user == address(0)) {
            revert Errors.ZeroAddressNotAllowed();
        }
    }

    function _zeroValueCheck(uint256 _amount) private pure {
        if (_amount == 0) {
            revert Errors.ZeroValueNotAllowed();
        }
    }

    function _onlyEventManager(uint256 _eventId) private view{
        if(!(eventObjects[_eventId].manager == msg.sender)){
            revert Errors.NotAManager();
        }
    }

    // creates an event
    function _createEvent(
        uint256 _id,
        address _nftAddress,
        string memory _eventName,
        EventType _eventType,
        uint256 _maxRegistrations
    ) private view returns (EventObj memory) {
        address[] memory defaultList;

        EventObj memory eventObj = EventObj({
            id: _id,
            eventName: _eventName,
            manager: msg.sender,
            nftAddress: _nftAddress,
            dateCreated: block.timestamp,
            eventType: _eventType,
            numberOfRegisteredPersons: 0,
            numberOfAttendees: 0,
            maxNumberOfRegistrations: _maxRegistrations,
            isDone: false,
            hasCanceled: false,
            registeredPersons: defaultList
        });
        return eventObj;
    }

    function _getNftBalance(
        address _nftAddress,
        address _user
    ) private view returns (uint) {
        return IERC721(_nftAddress).balanceOf(_user);
    }

    // external functions

    function createEvent(
        address _nftAddress,
        string memory _eventName,
        EventType _eventType,
        uint256 _maxRegistrations
    ) external {
        _sanityCheck(msg.sender);
        _sanityCheck(_nftAddress);
        _zeroValueCheck(_maxRegistrations);

        uint _eventCount = eventCount + 1;
        EventObj memory eventObj = _createEvent(
            _eventCount,
            _nftAddress,
            _eventName,
            _eventType,
            _maxRegistrations
        );

        eventObjects[_eventCount] = eventObj;
        eventCount += 1;

        emit Events.EventCreatedSuccessfully(
            _eventName,
            msg.sender,
            _nftAddress
        );
    }

    function createEvent(
        address _nftAddress,
        string memory _eventName,
        EventType _eventType
    ) external {
        _sanityCheck(msg.sender);
        _sanityCheck(_nftAddress);

        uint _eventCount = eventCount + 1;
        EventObj memory eventObj = _createEvent(
            _eventCount,
            _nftAddress,
            _eventName,
            _eventType,
            type(uint).max
        );
        allEvents.push(eventObj);
        eventObjects[_eventCount] = eventObj;
        eventCount += 1;

        emit Events.EventCreatedSuccessfully(
            _eventName,
            msg.sender,
            _nftAddress
        );
    }

    // function updateEvent() external {

    //}

    // get all event applicants
    //get all event attendees

    function registerForEvent(string memory _name, uint256 _eventId) external {
        _sanityCheck(msg.sender);
        _zeroValueCheck(_eventId);

        if (eventObjects[_eventId].id < 1) {
            revert Errors.InvalidEventId();
        }
        if (hasRegisteredForEvent[msg.sender][_eventId]) {
            revert Errors.CannotRegisterTwice();
        }
        // check if event is a valid one
        EventObj storage validEvent = eventObjects[_eventId];

        if (validEvent.isDone) {
            revert Errors.EventEndedAlready();
        }
        if (validEvent.hasCanceled) {
            revert Errors.EventCancelledAlready();
        }
        if (
            validEvent.numberOfRegisteredPersons + 1 >
            validEvent.maxNumberOfRegistrations
        ) {
            revert Errors.MaxRegistrationsExceeded();
        }

        // check if user has NFT
        uint noOfNFTsOwned = _getNftBalance(validEvent.nftAddress, msg.sender);

        if (noOfNFTsOwned < 1) {
            revert Errors.DoesNotHaveEventNFT();
        }
        // create the user
        uint256[] memory _defaultList;
        uint256[] memory _AttendedList;
        _AttendedList[0] = _eventId;

        uint256 _usersCount = usersCount + 1;
        User memory _user = User(
            _usersCount,
            _name,
            _AttendedList,
            _defaultList
        );

        userObj[msg.sender] = _user;
        users.push(_user);

        hasRegisteredForEvent[msg.sender][_eventId] = true;
        validEvent.numberOfRegisteredPersons += 1;
        validEvent.registeredPersons.push(msg.sender);
        usersCount = _usersCount;

        emit Events.EventSignInSuccessful(
            _eventId,
            msg.sender,
            validEvent.eventName
        );
    }

    function signInForEvent(uint256 _eventId) external {
        _sanityCheck(msg.sender);
        _zeroValueCheck(_eventId);

        if (eventObjects[_eventId].id < 1) {
            revert Errors.InvalidEventId();
        }
        if (!hasRegisteredForEvent[msg.sender][_eventId]) {
            revert Errors.CannotSigninToUnRegisteredEvent();
        }
        if (hasAttendedEvent[msg.sender][_eventId]) {
            revert Errors.CannotSignInTwice();
        }
        EventObj storage validEvent = eventObjects[_eventId];

        if (validEvent.isDone) {
            revert Errors.EventEndedAlready();
        }
        if (validEvent.hasCanceled) {
            revert Errors.EventCancelledAlready();
        }

        hasAttendedEvent[msg.sender][_eventId] = true;
        
        userObj[msg.sender].attendedEventIds.push(_eventId);

        emit Events.EventRegistrationSuccessful(
            _eventId,
            msg.sender,
            validEvent.eventName
        );
    }
}
