'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Voting.init({
    Title: DataTypes.STRING,
    Link: DataTypes.STRING,
    Start: DataTypes.STRING,
    End: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Voting',
  });
  return Voting;
};