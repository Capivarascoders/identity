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
    const persona02Address = accounts[3];

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

    describe('getPersonaByAddress', async () => {
        it('should throw if persona not exists', async () => {
            await Assert.reverts(
                contractInstance.getPersonaByAddress(persona01Address),
                'Identity: persona not exists!'
            );
        });

        it('success', async () => {
            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            const result = await contractInstance.getPersonaByAddress(persona01Address);

            assert.equal(0, result.score, 'wrong score');
            assert.equal(fields[0], result.infoFields[0], 'wrong infoFields[0]');
            assert.equal(fields[1], result.infoFields[1], 'wrong infoFields[1]');
            assert.equal(values[0], result.infoValues[0], 'wrong infoValues[0]');
            assert.equal(values[1], result.infoValues[1], 'wrong infoValues[1]');
        });
    });

    describe('getTotalPersonas', async () => {
        it('success', async () => {
            const fields = ['name', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });
            await contractInstance.addPersona(fields, values, { from: persona02Address });

            const result = await contractInstance.getTotalPersonas();

            assert.equal(2, result.toNumber(), 'wrong length');
        });
    });
});