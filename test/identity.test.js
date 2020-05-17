const Assert = require('truffle-assertions');
const Artifact = artifacts.require('../contracts/Identity');

const validationCostStrategy = {
    'ForFree': 0,
    'Charged': 1
};

contract('Identity', accounts => {
    let contractInstance;

    const ownerAddress = accounts[0];
    const validator01Address = accounts[1];

    before(async () => {
        web3.eth.defaultAccount = ownerAddress;
    });

    beforeEach(async () => {
        contractInstance = await Artifact.new();
    });

    describe('constructor', async () => {
        it('should publisher like owner', async () => {
            const result = await contractInstance.isOwner({ from: ownerAddress });
            assert.equal(true, result, 'wrong result');
        });
    });

    describe('getStakedValue', async () => {
        it('should thorw if not owner', async () => {
            await Assert.reverts(
                contractInstance.getStakedValue({ from: validator01Address }),
                'Ownable: caller is not the owner'
            );
        });

        it('success', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });
            const result = await contractInstance.getStakedValue({ from: ownerAddress });
            
            assert.notEqual(true, result, 'wrong staked value');
        });
    });
});