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
      Voting.belongsTo(models.VotingAdmin,{
        foreignKey:"userId",
      });
    }

    static RetriveElectionList(id){
      return this.findAll({
        where:{
          userId:id,
        },
        order:[["id","ASC"]],
      })
    }
    static addNewElection(title,id){
      return this.create({
        Title:title,
        userId:id,
        Start:false,
        End:false,
      })
    }
  }
  Voting.init({
    Title: DataTypes.STRING,
    Start: {
      type:DataTypes.BOOLEAN,
      defaultValue:false,
    },
    End:{
      type:DataTypes.BOOLEAN,
      defaultValue:false,
    },
  }, {
    sequelize,
    modelName: 'Voting',
  });
  return Voting;
};