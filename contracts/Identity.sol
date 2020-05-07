pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;


contract Identity {
    enum ValidationCostStrategy {ForFree, Charged}

    struct Validator {
        uint validatorId;
        address payable validatorAddress;
        uint reputation;
        ValidationCostStrategy strategy;
        uint price;
        bool exists;
    }

    struct Stamp {
        ValidationStatus status;
        uint whenDate;
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
        uint idPersona;
        uint price;
        string field;
        string ipfsPath;
        Stamp[] validations;
        ValidationStatus lastStatus;
        bool exists;
    }

    struct Persona {
        uint personaId;
        address payable personaAddress;
        mapping(string => string) personaInfos;
        bool exists;
        uint score;
    }

    Validator[] private _validators;
    mapping(uint => Validator) private _indexValidators;
    mapping(address => Validator) private _addressValidators;
    uint private _validatorId;

    Persona[] private _personas;
    mapping(uint => Persona) private _indexPersona;
    mapping(address => Persona) private _addressPersona;
    uint private _personaId;

    DataToBeValidated[] private _validations;
    mapping(uint => DataToBeValidated) private _indexDataToBeValidate;
    mapping(uint => DataToBeValidated[]) private _personaIdDataToBeValidate;
    mapping(uint => DataToBeValidated[]) private _validatorIdDataToBeValidate;
    mapping(address => mapping(string=> DataToBeValidated)) _personaFieldValidate;
    uint private _dataToBeValidatedId;

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

    event Validated(
        address personaAddress,
        address validateAddress,
        string field,
        ValidationStatus validationStatus
    );

    constructor() public {
        _personaId = 0;
        _validatorId = 0;
        _dataToBeValidatedId = 0;
    }

    function addValidator(
        ValidationCostStrategy validationCostStrategy,
        uint price
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

        for (uint i = 0; i < fields.length; i++) {
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

        for (uint i = 0; i < fields.length; i++) {
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
            bytes(persona.personaInfos[field]).length != 0,
            'Identity: field not exists!'
        );

        _dataToBeValidatedId++;

        DataToBeValidated storage data = _indexDataToBeValidate[_dataToBeValidatedId];
        data.idDataToBeValidated = _dataToBeValidatedId;
        data.idPersona = persona.personaId;
        data.price = msg.value;
        data.field = field;
        data.ipfsPath = ipfsHash;
        data.validations.push(Stamp(ValidationStatus.ValidationPending, now, validatorAddress));
        data.lastStatus = ValidationStatus.ValidationPending;
        data.exists = true;

        _validations.push(data);
        _indexDataToBeValidate[_dataToBeValidatedId] = data;
        _personaIdDataToBeValidate[persona.personaId].push(data);
        _validatorIdDataToBeValidate[validator.validatorId].push(data);

        _personaFieldValidate[persona.personaAddress][field] = data;

        emit ValidateAdded(
            persona.personaAddress,
            validator.validatorAddress,
            field
        );
    }

    function validate(
        address personaAddress,
        string memory field,
        ValidationStatus validationStatus
    ) public
      payable
    {
        Validator memory validator = _addressValidators[msg.sender];
        require(
            validator.exists,
            'Identity: validator not exists!'
        );

        Persona memory persona = _addressPersona[personaAddress];
        require(
            persona.exists,
            'Identity: persona not exists!'
        );

        DataToBeValidated memory dataToBeValidate = _personaFieldValidate[personaAddress][field];
        require(
            dataToBeValidate.exists,
            'Identity: data to be validate not exists!'
        );

        dataToBeValidate.lastStatus = validationStatus;
        dataToBeValidate.validations[dataToBeValidate.validations.length - 1] = Stamp(
                validationStatus,
                now,
                validator.validatorAddress);

        validator.reputation++;

        emit Validated(
            persona.personaAddress,
            validator.validatorAddress,
            field,
            validationStatus
        );
    }

    function getPersonaData(
        address personaAddress,
        string memory field
    ) public
      view
      returns (
          uint idDataToBeValidated,
          uint idPersona,
          uint price,
          string memory ipfsPath,
          ValidationStatus lastStatus
        )
      {
        Persona memory persona = _addressPersona[personaAddress];
        require(
            persona.exists,
            'Identity: persona not exists!'
        );

        DataToBeValidated memory dataToBeValidate = _personaFieldValidate[personaAddress][field];
        require(
            dataToBeValidate.exists,
            'Identity: data to be validate not exists!'
        );

        return(
            dataToBeValidate.idDataToBeValidated,
            dataToBeValidate.idPersona,
            dataToBeValidate.price,
            dataToBeValidate.ipfsPath,
            dataToBeValidate.lastStatus
        );
      }

    function getPersonaDataStamps(
        uint idDataToBeValidated
    ) public
      view
      returns(
        ValidationStatus[] memory status,
        uint[] memory whenDates,
        address[] memory addressesValidators
      )
    {
        DataToBeValidated memory dataToBeValidate = _indexDataToBeValidate[idDataToBeValidated];
        require(
            dataToBeValidate.exists,
            'Identity: data to be validate not exists!'
        );

        ValidationStatus[] memory validationStatusArray = new ValidationStatus[](dataToBeValidate.validations.length);
        uint[] memory whenDatesArray = new uint[](dataToBeValidate.validations.length);
        address[] memory addressesValidatorsArray = new address[](dataToBeValidate.validations.length);

        for(uint i = 0; i < dataToBeValidate.validations.length; i++){
            validationStatusArray[i] = dataToBeValidate.validations[i].status;
            whenDatesArray[i] = dataToBeValidate.validations[i].whenDate;
            addressesValidatorsArray[i] = dataToBeValidate.validations[i].addressValidator;
        }

        return(
            validationStatusArray,
            whenDatesArray,
            addressesValidatorsArray
        );
    }

    function getTotalValidators() public view returns(uint)
    {
        return _validators.length;
    }

    function getValidatorReputation(
        address validatorAddress
    ) public
      view
      returns(
          uint
      )
    {
        Validator memory validator = _addressValidators[validatorAddress];
        require(
            validator.exists,
            'Identity: validator not exists!'
        );

        return validator.reputation;
    }

    function getPersonaScore(
        address personaAddress
    ) public
      view
      returns(
          uint
      )
    {
        Persona memory persona = _addressPersona[personaAddress];
        require(
            persona.exists,
            'Identity: persona not exists!'
        );

        return persona.score;
    }
}
