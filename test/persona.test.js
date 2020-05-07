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

    describe('addPersona', async () => {
        it('should throw if fields and values have different length', async () => {
            const fields = ['name'];
            const values = ['persona1', 'persona1@email.com'];

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: fields and values must be the same length!'
            );
        });

        it('should throw if persona already exists', async () => {
            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: persona already exists!'
            );
        });

        it('should throw if persona field already exists', async () => {
            const fields = ['name', 'name'];
            const values = ['persona1', 'persona2'];

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: field already exists!'
            );
        });

        it('success', async () => {
            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const result = await contractInstance.addPersona(fields, values, { from: persona01Address });

            Assert.eventEmitted(
                result,
                'PersonaAdded',
                event => event.personaAddress == persona01Address);
        });
    });

    describe('addInfos', async () => {
        it('should throw if fields and values have different length', async () => {
            const fields = ['name'];
            const values = ['persona1', 'persona1@email.com'];

            await Assert.reverts(
                contractInstance.addInfos(fields, values, { from: persona01Address }),
                'Identity: fields and values must be the same length!'
            );
        });

        it('should throw if persona not exists', async () => {
            const fields = ['name'];
            const values = ['persona1'];

            await Assert.reverts(
                contractInstance.addInfos(fields, values, { from: persona01Address }),
                'Identity: persona not exists!'
            );
        });

        it('should throw if persona field already exists', async () => {
            const fields = ['name'];
            const values = ['persona1'];

            const newFields = ['name'];
            const newValues = ['persona'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.addInfos(newFields, newValues, { from: persona01Address }),
                'Identity: field already exists!'
            );
        });

        it('success', async () => {
            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const newFields = ['age'];
            const newValues = ['18'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });
            const result = await contractInstance.addInfos(newFields, newValues, { from: persona01Address });

            Assert.eventEmitted(
                result,
                'InfoAdded',
                event => event.personaAddress == persona01Address);
        });
    });

    describe('getPersonaData', async () => {
        it('should throw if persona not exists', async () => {
            const field = 'name';

            await Assert.reverts(
                contractInstance.getPersonaData(persona01Address, field),
                'Identity: persona not exists!'
            );
        });

        it('should throw if dataToValidate not exists', async () => {
            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field = 'name';

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.getPersonaData(persona01Address, field),
                'Identity: data to be validate not exists!'
            );
        });

        it('success', async () => {
            const price = 100;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address, value: validatorValue });

            const result = await contractInstance.getPersonaData(persona01Address, field);

            assert.equal(result.price, price, 'wrong price');
            assert.equal(result.ipfsPath, ipfsHash, 'wrong ipfsPath');
            assert.equal(result.lastStatus, validationStatus.ValidationPending, 'wrong ipfsPath');
        });
    });

    describe('getPersonaDataStamps', async () => {
        it('should throw if data to be validate not exists', async () => {
            const dataToBeValidateId = 1;
            
            await Assert.reverts(
                contractInstance.getPersonaDataStamps(dataToBeValidateId),
                'Identity: data to be validate not exists!'
            );
        });

        it('success', async () => {
            const price = 100;

            const field = 'name';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address, value: validatorValue });

            const resultData = await contractInstance.getPersonaData(persona01Address, field);

            const resultStamps = await contractInstance.getPersonaDataStamps(resultData.idDataToBeValidated.toNumber());
            
            assert.equal(1, resultStamps.status.length, 'wrong status length');
            assert.equal(1, resultStamps.whenDates.length, 'wrong whenDates length');
            assert.equal(1, resultStamps.addressesValidators.length, 'wrong addressesValidators length');
        });
    });

    describe('getPersonaScore', async () => {
        it('should throw if persona not exists', async () => {
            await Assert.reverts(
                contractInstance.getPersonaScore(persona01Address),
                'Identity: persona not exists!'
            );
        });

        it('success', async () => {
            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });
            const result = await contractInstance.getPersonaScore(persona01Address);

            assert.equal(0, result.toNumber(), 'wrong score');
        });
    });
});