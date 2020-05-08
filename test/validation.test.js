const Assert = require('truffle-assertions');
const Artifact = artifacts.require('../contracts/Identity');

const validationCostStrategy = {
    'ForFree': 0,
    'Charged': 1
};

const validationStatus = {
    'Validated': 0,
    'NotValidated': 1,
    'CannotEvaluate': 2,
    'ValidationPending': 3
};

contract('Identity', accounts => {
    let contractInstance;

    const ownerAddress = accounts[0];
    const validator01Address = accounts[1];
    const persona01Address = accounts[2];

    before(async () => {
        web3.eth.defaultAccount = ownerAddress;
    });

    beforeEach(async () => {
        contractInstance = await Artifact.new();
    });

    describe('askToValidate', async () => {
        it('should throw if validator not exists', async () => {
            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address }),
                'Identity: validator not exists!'
            );
        });

        it('should throw if persona not exists', async () => {
            const price = 100;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address }),
                'Identity: persona not exists!'
            );
        });

        it('should throw if validator strategy is charged and the value is diferent from price', async () => {
            const price = 100;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 90;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address, value: validatorValue }),
                'Identity: sended value is not the validator price!'
            );
        });

        it('should throw if field not exists!', async () => {
            const price = 100;

            const field = 'email';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address, value: validatorValue }),
                'Identity: field not exists!'
            );
        });

        it('validate success if validator strategy is charged', async () => {
            const price = 100;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            const result = await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address, value: validatorValue });

            Assert.eventEmitted(
                result,
                'ValidateAdded',
                event => event.personaAddress == persona01Address &&
                    event.validateAddress == validator01Address &&
                    event.field == field
            );
        });

        it('validate success if validator strategy is free', async () => {
            const price = 0;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            const result = await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address });

            Assert.eventEmitted(
                result,
                'ValidateAdded',
                event => event.personaAddress == persona01Address &&
                    event.validateAddress == validator01Address &&
                    event.field == field
            );
        });
    });

    describe('validate', async () => {
        it('should throw if validator not exists', async () => {
            const field = 'name';
            await Assert.reverts(
                contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address }),
                'Identity: validator not exists!'
            );
        });

        it('should throw if person not exists', async () => {
            const field = 'name';
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await Assert.reverts(
                contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address }),
                'Identity: persona not exists!'
            );
        });

        it('should throw if dataToBeValidate not exists', async () => {
            const field = 'name';
            const price = 100;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address }),
                'Identity: data to be validate not exists!'
            );
        });

        it('success', async () => {
            const field = 'name';
            const price = 100;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address });

            const result = await contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address });

            Assert.eventEmitted(
                result,
                'Validated',
                event => event.personaAddress == persona01Address &&
                    event.validateAddress == validator01Address &&
                    event.field == field &&
                    event.validationStatus == validationStatus.Validated
            );
        });

        it('success increment score if status validated', async () => {
            const field = 'name';
            const price = 100;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address });

            await contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address });

            const result = await contractInstance.getPersona(persona01Address);

            console.log(result.score.toNumber());
        });
    });
});