pragma solidity ^0.6.7;

contract Ownable {
  address private _owner;

  constructor() public {
    _owner = msg.sender;
  }

  modifier onlyOwner() {
    require(isOwner(), 'Ownable: caller is not the owner');
    _;
  }

  function owner(
  ) public view returns (address) {
    return _owner;
  }

  function isOwner(
  ) public view returns (bool) {
    return msg.sender == _owner;
  }
}