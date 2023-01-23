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
    static getNumberofVotes(ElectId,OptTitle,QueId){
      return this.findAll({
        where:{
          TotalVotes:OptTitle,
          ElectionId:ElectId,
          QuetionId:QueId,
        }
      })
    }

  }
  VoterDetail.init({
    ElectionId: DataTypes.INTEGER,
    QuetionId: DataTypes.INTEGER,
    VoterId: DataTypes.INTEGER,
    TotalVotes: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VoterDetail',
  });
  return VoterDetail;
};