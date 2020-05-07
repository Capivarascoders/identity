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
    const validator02Address = accounts[2];

    before(async () => {
        web3.eth.defaultAccount = ownerAddress;
    });

    beforeEach(async () => {
        contractInstance = await Artifact.new();
    });

    describe('addValidator', async () => {
        it('should throw if validate already exists', async () => {
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address }),
                'Identity: validator already exists!'
            );
        });

        it('success', async () => {
            const price = 100;

            const result = await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            Assert.eventEmitted(
                result,
                'ValidatorAdded',
                event => event.validatorAddress == validator01Address);
        });
    });

    describe('getTotalValidators', async () => {
        it('success', async () => {
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });
            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address });

            const result = await contractInstance.getTotalValidators();

            assert.equal(2, result.toNumber(), 'wrong length');
        });
    });

    describe('getValidatorReputation', async () => {
        it('should throw if validator not exists', async () => {
            await Assert.reverts(
                contractInstance.getValidatorReputation(validator01Address),
                'Identity: validator not exists!'
            );
        });

        it('success', async () => {
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });
            const result = await contractInstance.getValidatorReputation(validator01Address);

            assert.equal(0, result.toNumber(), 'wrong reputation');
        });
    });
});