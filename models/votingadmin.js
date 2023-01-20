'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VotingAdmin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      VotingAdmin.hasMany(models.ElectionDetail,{
        foreignKey:"userId"
      })
    }
  }
  VotingAdmin.init({
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    UserRole: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VotingAdmin',
  });
  return VotingAdmin;
};