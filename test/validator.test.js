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
            const price = 0;

            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address }),
                'Identity: if strategy is charged, price must be greather than 0 or strategy ForFree price must be equal 0!'
            );
        });
        
        it('should throw if validate already exists', async () => {
            const price = 0;

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

    describe('getValidatorByAddress', async () => {
        it('should throw if validator not exists', async () => {
            await Assert.reverts(
                contractInstance.getValidatorByAddress(validator01Address),
                'Identity: validator not exists!'
            );
        });

        it('success', async () => {
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });
            const result = await contractInstance.getValidatorByAddress(validator01Address);

            assert.equal(0, result.reputation.toNumber(), 'wrong reputation');
            assert.equal(validationCostStrategy.Charged, result.strategy.toNumber(), 'wrong strategy');
            assert.equal(price, result.price.toNumber(), 'wrong price');
        });
    });
});