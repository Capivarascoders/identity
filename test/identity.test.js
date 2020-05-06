const Assert = require('truffle-assertions');
const Artifact = artifacts.require('../contracts/Identity');

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

    describe('validator', async () => {
        it('addValidator throw if validate already exists', async () => {
            const validationCostStrategy = 0; //ForFree
            const price = 100;

            await contractInstance.addValidator(validationCostStrategy, price, { from: validator01Address });

            await Assert.reverts(
                contractInstance.addValidator(validationCostStrategy, price, { from: validator01Address }),
                'Identity: validator already exists!'
            );
        });

        it('addValidator success', async () => {
            const validationCostStrategy = 1; //Charged
            const price = 100;

            const result = await contractInstance.addValidator(validationCostStrategy, price, { from: validator01Address });

            Assert.eventEmitted(
                result,
                'ValidatorAdded',
                event => event.validatorAddress == validator01Address);
        });
    });

    describe('persona', async () => {
        it('addPersona throw if fields and values have different length', async () => {
            const fields = ['nome'];
            const values = ['persona1', 'persona1@email.com'];

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: fields and values must be the same length!'
            );
        });

        it('addPersona throw if persona already exists', async () => {
            const fields = ['nome'];
            const values = ['persona1'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: persona already exists!'
            );
        });

        it('addPersona throw if persona field already exists', async () => {
            const fields = ['nome', 'nome'];
            const values = ['persona1', 'persona2'];

            await Assert.reverts(
                contractInstance.addPersona(fields, values, { from: persona01Address }),
                'Identity: field already exists!'
            );
        });

        it('addPersona success', async () => {
            const fields = ['nome', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const result = await contractInstance.addPersona(fields, values, { from: persona01Address });

            Assert.eventEmitted(
                result,
                'PersonaAdded',
                event => event.personaAddress == persona01Address);
        });
    });

    describe('info', async () => {
        it('addInfos throw if fields and values have different length', async () => {
            const fields = ['nome'];
            const values = ['persona1', 'persona1@email.com'];

            await Assert.reverts(
                contractInstance.addInfos(fields, values, { from: persona01Address }),
                'Identity: fields and values must be the same length!'
            );
        });

        it('addInfos throw if persona not exists', async () => {
            const fields = ['nome'];
            const values = ['persona1'];

            await Assert.reverts(
                contractInstance.addInfos(fields, values, { from: persona01Address }),
                'Identity: persona not exists!'
            );
        });

        it('addInfos throw if persona field already exists', async () => {
            const fields = ['nome'];
            const values = ['persona1'];

            const newFields = ['nome'];
            const newValues = ['persona'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });

            await Assert.reverts(
                contractInstance.addInfos(newFields, newValues, { from: persona01Address }),
                'Identity: field already exists!'
            );
        });

        it('addInfos success', async () => {
            const fields = ['nome', 'email'];
            const values = ['persona1', 'persona1@email.com'];

            const newFields = ['idade'];
            const newValues = ['18'];

            await contractInstance.addPersona(fields, values, { from: persona01Address });
            const result = await contractInstance.addInfos(newFields, newValues, { from: persona01Address });

            Assert.eventEmitted(
                result,
                'InfoAdded',
                event => event.personaAddress == persona01Address);
        });
    });

    describe('validations', async () => {
        it('askToValidate throw if validator not exists', async () => {
            const field = 'nome';
            const ipfsHash = 'https://ipfs.infura.io/ipfs/Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

            await Assert.reverts(
                contractInstance.askToValidate(validator01Address, field, ipfsHash, { from: persona01Address }),
                'Identity: validator not exists!'
            );
        });
    });
});