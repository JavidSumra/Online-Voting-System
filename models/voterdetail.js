'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VoterDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VoterDetail.init({
    ElectionId: DataTypes.INTEGER,
    QuetionId: DataTypes.INTEGER,
    VoterId: DataTypes.INTEGER,
    TotalVote: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VoterDetail',
  });
  return VoterDetail;
};