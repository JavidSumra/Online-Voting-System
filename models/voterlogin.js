'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VoterLogin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VoterLogin.init({
    Status: DataTypes.BOOLEAN,
    VoterId: DataTypes.STRING,
    password: DataTypes.STRING,
    UserRole: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VoterLogin',
  });
  return VoterLogin;
};