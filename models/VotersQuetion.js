'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VoterQuetion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VoterQuetion.init({
    QuetionTitle: DataTypes.STRING,
    Description: DataTypes.STRING,
    Userid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'VoterQuetion',
  });
  return VoterQuetion;
};