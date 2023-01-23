'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuetionDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static getQuetionList(id){
      return this.findAll({
        where:{
          ElectionId:id,
        }
      })
    }
     
    static getParticularList(id){
      return this.findAll({
        where: { 
          id: id 
        },
      });
    }
    static removeQuetion(id){
       this.destroy({
        where:{
          id,
        }
      })
    }
    static removeParticularQuetion(id){
      return this.destroy({
        where:{
          ElectionId:id,
        }
      })
    }

    updateQuetion(title,desc){
      return this.update({
        QuetionTitle:title,
        Description:desc,
      })
    }
  }
  QuetionDetail.init({
    QuetionTitle: DataTypes.STRING,
    Description: DataTypes.STRING,
    ElectionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'QuetionDetail',
  });
  return QuetionDetail;
};