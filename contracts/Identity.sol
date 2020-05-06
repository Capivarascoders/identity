pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;

contract Identity {

    enum ValidationCostStrategy {
        ForFree,
        Charged
    }

    struct Validator {
        uint validatorId;
        address payable validatorAddress;
        uint32 reputation;
        ValidationCostStrategy strategy;
        uint32 price;
        bool exists;
    }

    struct Stamp {
        ValidationStatus status;
        uint whenDate;
        uint whenBlock;
    }

    enum ValidationStatus {
        Validated,
        NotValidated,
        CannotEvaluate,
        NewData,
        ValidationPending
    }

    struct DataToBeValidated {
        uint price;
        string ipfsPath;
        Stamp[] validations;
        ValidationStatus lastStatus;
    }

    struct Persona {
        uint personaId;
        address payable personaAddress;
        mapping(string => string) personaInfos;
        bool exists;
    }

    Validator[] private _validators;
    mapping(uint => Validator) private _indexValidators;
    mapping(address => Validator) private _addressValidators;
    uint private _validatorId;

    Persona[] private _personas;
    mapping(uint => Persona) private _indexPersona;
    mapping(address => Persona) private _addressPersona;
    uint private _personaId;

    event ValidatorAdded(
        address validatorAddress
    );

    event PersonaAdded(
        address personaAddress
    );

    constructor() public {
        _personaId = 0;
        _validatorId = 0;
    }

    function addValidator(
        ValidationCostStrategy validationCostStrategy,
        uint32 price
    ) public
    {
        require(!_addressValidators[msg.sender].exists, 'Identity: validator already exists!');

        _validatorId++;

        Validator memory validator = Validator(
            _validatorId,
            msg.sender,
            0,
            validationCostStrategy,
            price,
            true
        );

        _validators.push(validator);
        _indexValidators[_validatorId] = validator;
        _addressValidators[msg.sender] = validator;

        emit ValidatorAdded(msg.sender);
    }

    function addPersona(
        string[] memory fields,
        string[] memory values
    ) public
    {
        Persona storage persona = _addressPersona[msg.sender];

        require(fields.length == values.length, 'Identity: fields and values must be the same length!');
        require(!persona.exists, 'Identity: persona already exists!');

        _personaId++;

        persona.personaId = _personaId;
        persona.personaAddress = msg.sender;
        persona.exists = true;

        for(uint i = 0; i < fields.length; i++){
            string memory field = fields[i];
            require(bytes(persona.personaInfos[field]).length == 0, 'Identity: field already exists!');
            persona.personaInfos[fields[i]] = values[i];
        }

        emit PersonaAdded(msg.sender);
    }
}
