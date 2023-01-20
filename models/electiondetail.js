use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ElectionDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
     
    }
    static RetriveElection(userId){
      return this.findAll({
        where:{
          userId,
        }
      })
    }

    static RemoveElection(id,userId){
      return this.destroy({
        where:{
          id,
          userId,
        }
      })
    }
  }
  ElectionDetail.init({
    Title: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    Start: DataTypes.BOOLEAN,
    End: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ElectionDetail',
  });
  return ElectionDetail;
};
