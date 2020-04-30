const Assert = require("truffle-assertions");
const Artifact = artifacts.require("../contracts/Identity");

contract("Identity", accounts => {
    let contractInstance;

    const ownerAddress = accounts[0];

    before(async () => {
        web3.eth.defaultAccount = ownerAddress;
    });

    beforeEach(async () => {
        contractInstance = await Artifact.new();
    });

    describe('constructor', async () => {
        it('test description', async () => {

        });
    });
});