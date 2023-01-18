'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VotingOption extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VotingOption.init({
    OptionName: DataTypes.STRING,
    Votes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'VotingOption',
  });
  return VotingOption;
};