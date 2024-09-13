// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library Errors {
    error ZeroAddressNotAllowed();
    error ZeroValueNotAllowed();
    error NotAManager();
    error InvalidEventId();
    error CannotRegisterTwice();
    error CannotSignInTwice();
    error EventCancelledAlready();
    error EventEndedAlready();
    error DoesNotHaveEventNFT();
    error MaxRegistrationsExceeded();
    error CannotSigninToUnRegisteredEvent();
    error MaxRegistrationCantBeLessThanRegistrations();
}

library Events {
    event EventCreatedSuccessfully(
        string indexed _eventName,
        address indexed _manager,
        address indexed _nftAddress
    );
    event EventRegistrationSuccessful(
        uint256 indexed _eventId,
        address indexed _user,
        string indexed _eventName
    );
    event EventSignInSuccessful(
        uint256 indexed _eventId,
        address indexed _user,
        string indexed _eventName
    );
}

