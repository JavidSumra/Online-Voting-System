'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OptionDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  OptionDetail.init({
    OptionTitle: DataTypes.STRING,
    votes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'OptionDetail',
  });
  return OptionDetail;
};