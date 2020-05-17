pragma solidity 0.6.7;
pragma experimental ABIEncoderV2;

import './ownership/Ownable.sol';
import './Strings.sol';

contract Identity is Ownable, Strings {
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
        uint numberOfValidations;
        ValidationCostStrategy strategy;
        uint price;
        bool exists;
        bool active;
    }

    struct Stamp {
        uint idStamp;
        uint idDataToBeValidated;
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
    mapping(address => uint) private _personasIndex;
    uint private _personaId;

    DataToBeValidated[] private _validations;
    mapping(uint => uint[]) private _personaIdDataToBeValidate;
    mapping(uint => uint[]) private _validatorIdDataToBeValidate;
    mapping(address => mapping(string => uint)) private _personaFieldValidate;
    uint private _dataToBeValidatedId;

    Stamp[] private _validationStamps;
    mapping(uint => uint[]) private _dataToBeValidateStamps;
    uint private _stampId;

    event ValidatorAdded(
        address validatorAddress
    );

    event ValidatorDisabled(
         address validatorAddress
    );

    event ValidatorReactivated(
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

    event Validated(
        address personaAddress,
        address validateAddress,
        string field,
        ValidationStatus validationStatus
    );

    modifier validatorSendedStake(){
         require(
            msg.value == 1 ether,
            'You have to steak 1 ether to become a validator!'
        );
        _;
    }

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

    modifier validatorIsActive(
    )
    {
        uint index = _validatorsIndex[msg.sender];
        require(
            _validators[index].active,
            'Identity: validator is not active!'
        );
        _;
    }

    modifier validatorIsNotActive(
    )
    {
        uint index = _validatorsIndex[msg.sender];
        require(
            !_validators[index].active,
            'Identity: validator is active!'
        );
        _;
    }

    modifier validatorNotExists(
    )
    {
        require(
            _validatorsIndex[msg.sender] == 0,
            'Identity: validator already exists!'
        );
        _;
    }

    modifier personaExists(
        address personaAddress
    )
    {
        require(
            _personasIndex[personaAddress] != 0,
            'Identity: persona not exists!'
        );
        _;
    }

    modifier personaNotExists(
    )
    {
        require(
            _personasIndex[msg.sender] == 0,
            'Identity: persona already exists!'
        );
        _;
    }

    modifier dataToBeValidateExists(
        address personaAddress,
        string memory field
    )
    {
        require(
            _personaFieldValidate[personaAddress][field] != 0,
            'Identity: data to be validate not exists!'
        );
        _;
    }

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

        Stamp memory stamp;
        _validationStamps.push(
            stamp
        );
    }

    function getValidatorByAddress(
        address validatorAddress
    ) public
      view
        validatorExists(validatorAddress)
      returns(
        uint validatorId,
        uint numberOfValidations,
        ValidationCostStrategy strategy,
        uint price,
        bool active
      )
    {
        uint index = _validatorsIndex[validatorAddress];
        Validator memory validator = _validators[index];
        return(
            validator.validatorId,
            validator.numberOfValidations,
            validator.strategy,
            validator.price,
            validator.active
        );
    }

    function addValidator(
        ValidationCostStrategy validationCostStrategy,
        uint price
    ) public
      payable
        validatorSendedStake()
        validatorNotExists()
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
            true,
            true
        ));

        _validatorsIndex[msg.sender] = _validatorId;

        emit ValidatorAdded(msg.sender);
    }

    function disableValidator(
    ) public
        validatorExists(msg.sender)
        validatorIsActive()
    {
        address payable recipient = msg.sender;

        uint index = _validatorsIndex[msg.sender];
        _validators[index].active = false;

        recipient.transfer(1 ether);

        emit ValidatorDisabled(msg.sender);
    }

    function reactivateValidator(
    ) public
      payable
        validatorSendedStake()
        validatorExists(msg.sender)
        validatorIsNotActive()
    {
        uint index = _validatorsIndex[msg.sender];
        _validators[index].active = true;

        emit ValidatorReactivated(msg.sender);
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
        uint index = _personasIndex[personaAddress];
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
        personaNotExists()
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

        _personasIndex[msg.sender] = _personaId;

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
        Persona memory persona = _personas[_personasIndex[msg.sender]];

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
                'Identity: field is not in persona fields, value is required'
            );
            persona.infoFields[persona.infoFields.length - 1] = field;
            persona.infoValues[persona.infoValues.length - 1] = value;
        }

        _dataToBeValidatedId++;

        DataToBeValidated memory dataToBeValidated;
        dataToBeValidated.idDataToBeValidated = _dataToBeValidatedId;
        dataToBeValidated.idPersona = persona.personaId;
        dataToBeValidated.price = msg.value;
        dataToBeValidated.field = field;
        dataToBeValidated.ipfsPath = ipfsHash;
        dataToBeValidated.lastStatus = ValidationStatus.ValidationPending;

        _validations.push(dataToBeValidated);

        _personaIdDataToBeValidate[persona.personaId].push(_dataToBeValidatedId);
        _validatorIdDataToBeValidate[validator.validatorId].push(_dataToBeValidatedId);
        _personaFieldValidate[msg.sender][field] = _dataToBeValidatedId;

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
        validatorExists(msg.sender)
        personaExists(personaAddress)
        dataToBeValidateExists(personaAddress, field)
    {
        DataToBeValidated storage validation = _validations[_personaFieldValidate[personaAddress][field]];
        validation.lastStatus = validationStatus;

        _stampId++;
        _validationStamps.push(Stamp(_stampId, validation.idDataToBeValidated, validationStatus, now, msg.sender));
        _dataToBeValidateStamps[validation.idDataToBeValidated].push(_stampId);

        if(validationStatus == ValidationStatus.Validated){
            _personas[_personasIndex[personaAddress]].score++;
        } else if(validationStatus == ValidationStatus.NotValidated && _personas[_personasIndex[personaAddress]].score > 0){
            _personas[_personasIndex[personaAddress]].score--;
        }

        _validators[_validatorsIndex[msg.sender]].numberOfValidations++;

        emit Validated(
            personaAddress,
            msg.sender,
            field,
            validationStatus
        );
    }

    function getIdsDataToBeValidatedIdByPersonaId(
        uint personaId
    ) public
      view
      returns(
        uint[] memory ids
      )
    {
        return _personaIdDataToBeValidate[personaId];
    }

     function getDataToBeValidatedById(
        uint dataToBeValidatedId
    ) public
      view
      returns(
        uint idPersona,
        uint price,
        string memory field,
        string memory ipfsPath,
        ValidationStatus lastStatus
      )
    {
        DataToBeValidated storage data = _validations[dataToBeValidatedId];
        return(
            data.idPersona,
            data.price,
            data.field,
            data.ipfsPath,
            data.lastStatus
        );
    }

    function getIdsStampsByDataToBeValidatedId(
        uint dataToBeValidatedId
    ) public
      view
      returns(
        uint[] memory ids
      )
    {
        return _dataToBeValidateStamps[dataToBeValidatedId];
    }

     function getStampById(
        uint stampId
    ) public
      view
      returns(
        uint idDataToBeValidated,
        ValidationStatus status,
        uint whenDate,
        address addressValidator
      )
    {
        Stamp storage stamp = _validationStamps[stampId];
        return(
            stamp.idDataToBeValidated,
            stamp.status,
            stamp.whenDate,
            stamp.addressValidator
        );
    }

    function getStakedValue(
    ) public
      view
        onlyOwner()
      returns(
          uint
      )
    {
        return address(this).balance;
    }
}