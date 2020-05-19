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
    const validator02Address = accounts[3];
    const persona01Address = accounts[2];
    const persona02Address = accounts[4];

    before(async () => {
        web3.eth.defaultAccount = ownerAddress;
    });

    beforeEach(async () => {
        contractInstance = await Artifact.new();
    });

    describe('askToValidate', async () => {
        it('should throw if validator not exists', async () => {
            const field = 'name';
            const value = 'persona1';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address }),
                'Identity: validator not exists!'
            );
        });

        it('should throw if persona not exists', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            const field = 'name';
            const value = 'persona1';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address }),
                'Identity: persona not exists!'
            );
        });

        it('should throw if validator strategy is charged and the value is diferent from price', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            const field = 'name';
            const value = 'persona1';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 90;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address, value: validatorValue }),
                'Identity: sended value is not the validator price!'
            );
        });

        it('should throw if field not exists!', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            const field = 'email';
            const value = '';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address, value: validatorValue }),
                'Identity: field is not in persona fields, value is required'
            );
        });

        it('validate success if validator strategy is charged', async () => {
            const price = 100;
            const stakeValue = 1000000000000000000;

            const field = 'name';
            const value = '';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const validatorValue = 100;

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            const result = await contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address, value: validatorValue });

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
            const stakeValue = 1000000000000000000;

            const field = 'name';
            const value = '';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            const fields = ['name'];
            const values = ['persona1'];

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            const result = await contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address });

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
            const price = 0;
            const stakeValue = 1000000000000000000;

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await Assert.reverts(
                contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address }),
                'Identity: persona not exists!'
            );
        });

        it('should throw if dataToBeValidate not exists', async () => {
            const field = 'name';
            const price = 0;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address }),
                'Identity: data to be validate not exists!'
            );
        });

        it('success', async () => {
            const field = 'name';
            const value = '';
            const price = 0;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address });

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

        it('success increment persona score if status validated if status is valid', async () => {
            const field = 'name';
            const value = '';
            const price = 0;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field, value, ipfsHash, { from: persona01Address });

            await contractInstance.validate(persona01Address, field, validationStatus.Validated, { from: validator01Address });

            const result = await contractInstance.getPersonaByAddress(persona01Address);

            assert.equal(1, result.score.toNumber());
        });

        it('success decrement persona score if first validation status validated with stauts is not valid', async () => {
            const field1 = 'name';
            const value1 = '';

            const field2 = 'email';
            const value2 = '';

            const price = 0;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address });

            await contractInstance.validate(persona01Address, field1, validationStatus.NotValidated, { from: validator01Address });

            const result = await contractInstance.getPersonaByAddress(persona01Address);

            assert.equal(0, result.score.toNumber(), 'wrong score');
        });

        it('success decrement persona score if status validated with stauts is not valid', async () => {
            const field1 = 'name';
            const value1 = '';

            const field2 = 'email';
            const value2 = '';

            const price = 0;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addValidator(validationCostStrategy.ForFree, price, { from: validator02Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address });

            await contractInstance.askToValidate(validator02Address, field2, value2, ipfsHash, { from: persona01Address });

            await contractInstance.validate(persona01Address, field1, validationStatus.Validated, { from: validator01Address });

            const resultBeforeValidation = await contractInstance.getPersonaByAddress(persona01Address);

            await contractInstance.validate(persona01Address, field2, validationStatus.NotValidated, { from: validator01Address });

            const resultAfterValidation = await contractInstance.getPersonaByAddress(persona01Address);

            assert.notEqual(resultBeforeValidation.score.toNumber(), resultAfterValidation.score.toNumber(), 'wrong score');
        });

        it('success transfer value to validator', async () => {
            const field1 = 'name';
            const value1 = '';

            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            let balanceValidatorBefore = await web3.eth.getBalance(validator01Address);

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.validate(persona01Address, field1, validationStatus.Validated, { from: validator01Address });

            let balanceValidatorAfter = await web3.eth.getBalance(validator01Address);

            assert.notEqual(balanceValidatorBefore, balanceValidatorAfter, 'wrong balance');
        });

        it('success increment validator number of validation if validated', async () => {
            const field1 = 'name';
            const value1 = '';

            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            const validatorBefore = await contractInstance.getValidatorByAddress(validator01Address);

            await contractInstance.validate(persona01Address, field1, validationStatus.Validated, { from: validator01Address });

            const validatorAfter = await contractInstance.getValidatorByAddress(validator01Address);

            assert.notEqual(validatorBefore.numberOfValidations, validatorAfter.numberOfValidations, 'wrong numberOfValidations');
        });
    });

    describe('getIdsDataToBeValidatedIdByValidatorId', async () => {
        it('success', async () => {
            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field1 = 'name';
            const value1 = '';

            const field2 = 'email';
            const value2 = '';

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });
            
            await contractInstance.addPersona(fields, values, { from: persona02Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.askToValidate(validator01Address, field2, value2, ipfsHash, { from: persona02Address, value: price });

            const validator = await contractInstance.getValidatorByAddress(validator01Address);

            const result = await contractInstance.getIdsDataToBeValidatedIdByValidatorId(validator.validatorId);

            assert.equal(2, result.length, 'wrong length');
        });
    });

    describe('getIdsDataToBeValidatedIdByPersonaId', async () => {
        it('success', async () => {
            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field1 = 'name';
            const value1 = '';

            const field2 = 'email';
            const value2 = '';

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.askToValidate(validator02Address, field2, value2, ipfsHash, { from: persona01Address, value: price });

            const persona = await contractInstance.getPersonaByAddress(persona01Address);

            const result = await contractInstance.getIdsDataToBeValidatedIdByPersonaId(persona.personaId);

            assert.equal(2, result.length, 'wrong length');
        });
    });

    describe('getDataToBeValidatedById', async () => {
        it('success', async () => {
            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field1 = 'name';
            const value1 = '';

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            const persona = await contractInstance.getPersonaByAddress(persona01Address);

            const dataIds = await contractInstance.getIdsDataToBeValidatedIdByPersonaId(persona.personaId);

            const result = await contractInstance.getDataToBeValidatedById(dataIds[0]);

            assert.equal(persona.personaId.toNumber(), result.idPersona.toNumber(), 'worng personaId');
            assert.equal(price, result.price.toNumber(), 'worng price');
            assert.equal(field1, result.field, 'worng field');
            assert.equal(ipfsHash, result.ipfsPath, 'worng ipfsHash');
            assert.equal(validationStatus.ValidationPending, result.lastStatus.toNumber(), 'worng lastStatus');
        });
    });

    describe('getIdsStampsByDataToBeValidatedId', async () => {
        it('success', async () => {
            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field1 = 'name';
            const value1 = '';

            const field2 = 'email';
            const value2 = '';

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.askToValidate(validator02Address, field2, value2, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.validate(persona01Address, field1, validationStatus.Validated, { from: validator01Address });

            const persona = await contractInstance.getPersonaByAddress(persona01Address);

            const dataIds = await contractInstance.getIdsDataToBeValidatedIdByPersonaId(persona.personaId);

            const result = await contractInstance.getIdsStampsByDataToBeValidatedId(dataIds[0]);

            assert.equal(1, result.length, 'wrong length');
        });
    });

    describe('getStampById', async () => {
        it('success', async () => {
            const price = 1000000000;
            const stakeValue = 1000000000000000000;

            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const field1 = 'name';
            const value1 = '';

            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator01Address, value: stakeValue });

            await contractInstance.addValidator(validationCostStrategy.Charged, price, { from: validator02Address, value: stakeValue });

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await contractInstance.askToValidate(validator01Address, field1, value1, ipfsHash, { from: persona01Address, value: price });

            await contractInstance.validate(persona01Address, field1, validationStatus.Validated, { from: validator01Address });

            const persona = await contractInstance.getPersonaByAddress(persona01Address);

            const dataIds = await contractInstance.getIdsDataToBeValidatedIdByPersonaId(persona.personaId);

            const stampIds = await contractInstance.getIdsStampsByDataToBeValidatedId(dataIds[0]);

            const result = await contractInstance.getStampById(stampIds[0]);

            assert.equal(dataIds[0].toNumber(), result.idDataToBeValidated.toNumber(), 'worng idDataToBeValidated');
            assert.equal(validationStatus.Validated, result.status.toNumber(), 'worng status');
            assert.notEqual(0, result.whenDate.toNumber(), 'worng whenDate');
            assert.equal(validator01Address, result.addressValidator, 'worng addressValidator');
        });
    });
});