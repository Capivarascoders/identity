const Migrations = artifacts.require("Identity");

module.exports = function (deployer) {
    deployer.deploy(Migrations);
};
