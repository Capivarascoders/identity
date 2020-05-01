pragma solidity 0.6.4;


contract Identity {
    string private _value;

    function set(string memory value) public {
        _value = value;
    }

    function get() public view returns (string memory) {
        return _value;
    }
}
