pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;


contract Identity {
    enum ValidationCostStrategy {ForFree, Charged}

    struct Validator {
        uint256 validatorId;
        address payable validatorAddress;
        uint32 reputation;
        ValidationCostStrategy strategy;
        uint32 price;
        bool exists;
    }

    struct Stamp {
        ValidationStatus status;
        uint256 whenDate;
        address addressValidator;
    }

    enum ValidationStatus {
        Validated,
        NotValidated,
        CannotEvaluate,
        ValidationPending
    }

    struct DataToBeValidated {
        uint idDataToBeValidated;
        uint256 idPersona;
        uint256 price;
        string field;
        string ipfsPath;
        Stamp[] validations;
        ValidationStatus lastStatus;
    }

    struct Persona {
        uint256 personaId;
        address payable personaAddress;
        mapping(string => string) personaInfos;
        bool exists;
    }

    Validator[] private _validators;
    mapping(uint256 => Validator) private _indexValidators;
    mapping(address => Validator) private _addressValidators;
    uint256 private _validatorId;

    Persona[] private _personas;
    mapping(uint256 => Persona) private _indexPersona;
    mapping(address => Persona) private _addressPersona;
    uint256 private _personaId;

    DataToBeValidated[] private _validations;
    mapping(uint256 => DataToBeValidated) private _indexDataToBeValidate;
    mapping(uint256 => DataToBeValidated[]) private _personaIdDataToBeValidate;
    mapping(uint256 => DataToBeValidated[]) private _validatorIdDataToBeValidate;
    uint256 private _dataToBeValidatedId;

    event ValidatorAdded(
        address validatorAddress
    );

    event PersonaAdded(
        address personaAddress
    );

    event InfoAdded(
        address personaAddress
    );

    event ValidateAdded(
        address personaAddress,
        address validateAddress,
        string field
    );

    constructor() public {
        _personaId = 0;
        _validatorId = 0;
        _dataToBeValidatedId = 0;
    }

    function addValidator(
        ValidationCostStrategy validationCostStrategy,
        uint32 price
    ) public {
        require(
            !_addressValidators[msg.sender].exists,
            'Identity: validator already exists!'
        );

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

        require(
            fields.length == values.length,
            'Identity: fields and values must be the same length!'
        );

        require(
            !persona.exists,
            'Identity: persona already exists!'
        );

        _personaId++;

        persona.personaId = _personaId;
        persona.personaAddress = msg.sender;
        persona.exists = true;

        for (uint256 i = 0; i < fields.length; i++) {
            string memory field = fields[i];
            require(
                bytes(persona.personaInfos[field]).length == 0,
                'Identity: field already exists!'
            );
            persona.personaInfos[fields[i]] = values[i];
        }

        emit PersonaAdded(msg.sender);
    }

    function addInfos(
        string[] memory fields,
        string[] memory values
    ) public
    {
        Persona storage persona = _addressPersona[msg.sender];

        require(
            fields.length == values.length,
            'Identity: fields and values must be the same length!'
        );

        require(
            persona.exists,
            'Identity: persona not exists!'
        );

        for (uint256 i = 0; i < fields.length; i++) {
            string memory field = fields[i];
            require(
                bytes(persona.personaInfos[field]).length == 0,
                'Identity: field already exists!'
            );
            persona.personaInfos[fields[i]] = values[i];
        }

        emit InfoAdded(msg.sender);
    }

    function askToValidate(
        address validatorAddress,
        string memory field,
        string memory ipfsHash
    ) public
      payable
    {
        Validator memory validator = _addressValidators[validatorAddress];
        require(
            validator.exists,
            'Identity: validator not exists!'
        );

        Persona storage persona = _addressPersona[msg.sender];
        require(
            persona.exists,
            'Identity: persona not exists!'
        );

        if (validator.strategy == ValidationCostStrategy.Charged) {
            require(
                msg.value == validator.price,
                'Identity: sended value is not the validator price!'
            );
            validator.validatorAddress.transfer(msg.value);
        }

        require(
            bytes(persona.personaInfos[field]).length == 0,
            'Identity: field not exists!'
        );

        _dataToBeValidatedId++;

        DataToBeValidated storage data = _indexDataToBeValidate[_dataToBeValidatedId];
        data.idDataToBeValidated = _dataToBeValidatedId;
        data.idPersona = persona.personaId;
        data.price = msg.value;
        data.field = field;
        data.ipfsPath = ipfsHash;
        data.validations[0] = Stamp(ValidationStatus.ValidationPending, now, validatorAddress);
        data.lastStatus = ValidationStatus.ValidationPending;

        _validations.push(data);
        _indexDataToBeValidate[_dataToBeValidatedId] = data;
        _personaIdDataToBeValidate[persona.personaId].push(data);
        _validatorIdDataToBeValidate[validator.validatorId].push(data);

        emit ValidateAdded(
            persona.personaAddress,
            validator.validatorAddress,
            field
        );
    }

    function validate(

    ) public
    {

    }
}
