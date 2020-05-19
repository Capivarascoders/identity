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
        const price = 0;

        it('should throw is stake value is not sended', async () => {
            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address }),
                'You have to steak 1 ether to become a validator!'
            );
        });

        it('should throw if validator strategy is charged and value is not sended', async () => {
            const price = 0;
            const stakeValue = 1000000000000000000;

            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue }),
                'Identity: if strategy is charged, price must be greather than 0 or strategy ForFree price must be equal 0!'
            );
        });

        it('should throw if validator already exists', async () => {
            const price = 0;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue }),
                'Identity: validator already exists!'
            );
        });

        it('success', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            const result = await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            Assert.eventEmitted(
                result,
                'ValidatorAdded',
                event => event.validatorAddress == validator01Address);
        });

        it('success send 1 ether stake', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            const balanceAfter = await web3.eth.getBalance(contractInstance.address);

            assert.equal(stakeValue, balanceAfter, 'wrong balance stake');
        });
    });

    describe('disableValidator', async () => {
        it('should throw if validator not exist', async () => {
            await Assert.reverts(
                contractInstance.disableValidator({ from: validator01Address }),
                'Identity: validator not exists!'
            );
        });

        it('should throw if validator is not active', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.disableValidator({ from: validator01Address });

            await Assert.reverts(
                contractInstance.disableValidator({ from: validator01Address }),
                'Identity: validator is not active!'
            );
        });

        it('success', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            const result = await contractInstance.disableValidator({ from: validator01Address });

            const validator = await contractInstance.getValidatorByAddress(validator01Address);

            assert.equal(false, validator.active, 'wrong active param')
            Assert.eventEmitted(
                result,
                'ValidatorDisabled',
                event => event.validatorAddress == validator01Address);
        });
    });

    describe('reactivateValidator', async () => {
        it('should throw is stake value is not sended', async () => {
            await Assert.reverts(
                contractInstance.reactivateValidator({ from: validator01Address }),
                'You have to steak 1 ether to become a validator!'
            );
        });

        it('should throw if validator not exist', async () => {
            const stakeValue = 1000000000000000000;

            await Assert.reverts(
                contractInstance.reactivateValidator({ from: validator01Address, value: stakeValue }),
                'Identity: validator not exists!'
            );
        });

        it('should throw if validator is active', async () => {
            const stakeValue = 1000000000000000000;
            const price = 0;

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await Assert.reverts(
                contractInstance.reactivateValidator({ from: validator01Address, value: stakeValue }),
                'Identity: validator is active!'
            );
        });

        it('success', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.disableValidator({ from: validator01Address });

            const result = await contractInstance.reactivateValidator({ from: validator01Address, value: stakeValue });

            const validator = await contractInstance.getValidatorByAddress(validator01Address);

            assert.equal(true, validator.active, 'wrong active param')
            Assert.eventEmitted(
                result,
                'ValidatorReactivated',
                event => event.validatorAddress == validator01Address);
        });

        it('success contract received 1 ether stake', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.disableValidator({ from: validator01Address });

            await contractInstance.reactivateValidator({ from: validator01Address, value: stakeValue });

            await contractInstance.getValidatorByAddress(validator01Address);

            const balanceAfter = await web3.eth.getBalance(contractInstance.address);

            assert.equal(stakeValue, balanceAfter, 'wrong balance stake');
        });
    });

    describe('getTotalValidators', async () => {
        it('success', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });
            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address, value: stakeValue });

            const result = await contractInstance.getTotalValidators();

            assert.equal(2, result.toNumber(), 'wrong length');
        });
    });

    describe('isValidator', async () => {
        it('success false', async () => {
            const result = await contractInstance.isValidator(validator01Address);

            assert.equal(false, result, 'wrong result');
        });

        it('success true', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            const result = await contractInstance.isValidator(validator01Address);

            assert.equal(true, result, 'wrong result');
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
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });
            const result = await contractInstance.getValidatorByAddress(validator01Address);

            assert.equal(0, result.numberOfValidations.toNumber(), 'wrong numberOfValidations');
            assert.equal(validationCostStrategy.Charged, result.strategy.toNumber(), 'wrong strategy');
            assert.equal(price, result.price.toNumber(), 'wrong price');
        });
    });
});