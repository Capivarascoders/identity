pragma solidity 0.6.7;
pragma experimental ABIEncoderV2;

import './Strings.sol';

//score +1 a cada validacao positiva
//score -1 a cada validacao negativa

//reputation +1 a cada validacao

contract Identity is Strings {
    enum ValidationCostStrategy {
        ForFree,
        Charged
    }

    enum ValidationStatus {
        Validated,
        NotValidated,
        CannotEvaluate,
        ValidationPending
    }

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

    struct DataToBeValidated {
        uint idDataToBeValidated;
        uint idPersona;
        uint price;
        string field;
        string ipfsPath;
        Stamp[] validations;
        ValidationStatus lastStatus;
    }

    struct Persona {
        uint personaId;
        address payable personaAddress;
        string[] infoFields;
        string[] infoValues;
        uint score;
        bool exists;
    }

    Validator[] private _validators;
    mapping(address => uint) private _validatorsIndex;
    uint private _validatorId;

    Persona[] private _personas;
    mapping(address => uint) private _personaIndex;
    uint private _personaId;

    DataToBeValidated[] private _validations;
    mapping(uint => uint[]) private _personaIdDataToBeValidate;
    mapping(uint => uint[]) private _validatorIdDataToBeValidate;
    mapping(address => mapping(string=> DataToBeValidated)) _personaFieldValidate;
    uint private _dataToBeValidatedId;

    constructor() public
    {
        Validator memory validator;
        _validators.push(
            validator
        );

        Persona memory persona;
        _personas.push(
            persona
        );

        DataToBeValidated memory validation;
        _validations.push(
            validation
        );
    }

    event ValidatorAdded(
        address validatorAddress
    );

    event PersonaAdded(
        address personaAddress
    );

    event ValidateAdded(
        address personaAddress,
        address validateAddress,
        string field
    );

    modifier validatorExists(
        address validatorAddress
    )
    {
        require(
            _validatorsIndex[validatorAddress] != 0,
            'Identity: validator not exists!'
        );
        _;
    }

    modifier validatorNotExists(
        address validatorAddress
    )
    {
        require(
            _validatorsIndex[validatorAddress] == 0,
            'Identity: validator already exists!'
        );
        _;
    }

    modifier personaExists(
        address personaAddress
    )
    {
        require(
            _personaIndex[personaAddress] != 0,
            'Identity: validator not exists!'
        );
        _;
    }

    modifier personaNotExists(
        address personaAddress
    )
    {
        require(
            _personaIndex[personaAddress] == 0,
            'Identity: persona already exists!'
        );
        _;
    }

    function getValidatorByAddress(
        address validatorAddress
    ) public
      view
        validatorExists(validatorAddress)
      returns(
        uint validatorId,
        uint reputation,
        ValidationCostStrategy strategy,
        uint price
      )
    {
        uint index = _validatorsIndex[validatorAddress];
        Validator memory validator = _validators[index];
        return(
            validator.validatorId,
            validator.reputation,
            validator.strategy,
            validator.price
        );
    }

    function addValidator(
        ValidationCostStrategy validationCostStrategy,
        uint price
    ) public
        validatorNotExists(msg.sender)
    {
        require(
            validationCostStrategy == ValidationCostStrategy.ForFree &&
            price == 0 ||
            validationCostStrategy == ValidationCostStrategy.Charged &&
            price > 0,
            'Identity: if strategy is charged, price must be greather than 0 or strategy ForFree price must be equal 0!'
        );

        _validatorId++;

        _validators.push(Validator(
            _validatorId,
            msg.sender,
            0,
            validationCostStrategy,
            price,
            true
        ));

        _validatorsIndex[msg.sender] = _validatorId;

        emit ValidatorAdded(msg.sender);
    }

    function getTotalValidators(
    ) public
      view
      returns(uint)
    {
        return _validators.length - 1;
    }

    function getPersonaByAddress(
        address personaAddress
    ) public
      view
        personaExists(personaAddress)
      returns(
        uint personaId,
        string[] memory infoFields,
        string[] memory infoValues,
        uint score
      )
    {
        uint index = _personaIndex[personaAddress];
        Persona memory persona = _personas[index];
        return(
            persona.personaId,
            persona.infoFields,
            persona.infoValues,
            persona.score
        );
    }

    function addPersona(
        string[] memory fields,
        string[] memory values
    ) public
        personaNotExists(msg.sender)
    {
        require(
            fields.length == values.length,
            'Identity: fields and values must be the same length!'
        );

        _personaId++;

        _personas.push(Persona(
            _personaId,
            msg.sender,
            fields,
            values,
            0,
            true
        ));

        _personaIndex[msg.sender] = _personaId;

        emit PersonaAdded(msg.sender);
    }

    function getTotalPersonas(
    ) public
      view
      returns(uint)
    {
        return _personas.length - 1;
    }

    function askToValidate(
        address validatorAddress,
        string memory field,
        string memory value,
        string memory ipfsHash
    ) public
      payable
        validatorExists(validatorAddress)
        personaExists(msg.sender)
    {
        Validator memory validator = _validators[_validatorsIndex[validatorAddress]];
        Persona memory persona = _personas[_personaIndex[msg.sender]];

        if(validator.strategy == ValidationCostStrategy.Charged){
            require(
                msg.value == validator.price,
                'Identity: sended value is not the validator price!'
            );
            validator.validatorAddress.transfer(msg.value);
        }

        bool fieldExists = false;
        for(uint i = 0; i < persona.infoFields.length; i++){
            if(compareStringsbyBytes(field, persona.infoFields[i]))
                fieldExists = true;
        }

        if(!fieldExists){
            require(
                bytes(value).length > 0,
                'Identity: field is not inn persona fields, value is required'
            );
            persona.infoFields[persona.infoFields.length - 1] = field;
            persona.infoValues[persona.infoValues.length - 1] = value;
        }

        _dataToBeValidatedId++;

        Stamp[] storage stamps = new Stamp[](1);
        stamps.push(Stamp({status: ValidationStatus.ValidationPending, whenDate: now, addressValidator: validatorAddress}));

        DataToBeValidated memory dataToBeValidated = DataToBeValidated(
            _dataToBeValidatedId,
            persona.personaId,
            msg.value,
            field,
            ipfsHash,
            stamps,
            ValidationStatus.ValidationPending
        );

        _validations.push(dataToBeValidated);

        _personaIdDataToBeValidate[persona.personaId].push(_dataToBeValidatedId);
        _validatorIdDataToBeValidate[validator.validatorId].push(_dataToBeValidatedId);
        _personaFieldValidate[msg.sender][field] = dataToBeValidated;

        emit ValidateAdded(
            persona.personaAddress,
            validator.validatorAddress,
            field
        );
    }
}