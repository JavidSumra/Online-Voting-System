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
    static getVotersList(id){
      return this.findAll({
        where:{
          userElectionId:id,
        }
      })
    }

    static removeVoter(id){
      this.destroy({
        where:{
         id,
        }
      })
    }
    static removeParticularVoter(id){
      this.destroy({
        where:{
          userElectionId:id,
        }
      })
    }
  }
  VoterLogin.init({
    Status: DataTypes.BOOLEAN,
    VoterId: DataTypes.STRING,
    password: DataTypes.STRING,
    userElectionId: DataTypes.INTEGER,
    UserRole: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VoterLogin',
  });
  return VoterLogin;
};