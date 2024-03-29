"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ElectionDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static RetriveElection(userId) {
      return this.findAll({
        where: {
          userId,
        },
        order: [["id", "ASC"]],
      });
    }

    static findByElectID(id) {
      return this.findAll({
        where: {
          id,
        },
        order: [["id", "ASC"]],
      });
    }

    static RemoveElection(id, userId) {
      return this.destroy({
        where: {
          id: id,
          userId: userId,
        },
      });
    }
    StartElection(id) {
      return this.update({
        where: {
          id,
        },
        Start: true,
        End: false,
      });
    }

    EndElection(id) {
      return this.update({
        where: {
          id,
        },
        End: true,
        Start: false,
      });
    }
    static getLiveElection(userId) {
      return this.findAll({
        where: {
          userId,
          Start: true,
          End: false,
        },
      });
    }
    static getCompletedElection(userId) {
      return this.findAll({
        where: {
          userId,
          End: true,
          Start: false,
        },
      });
    }
  }
  ElectionDetail.init(
    {
      Title: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      Start: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      End: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ElectionDetail",
    }
  );
  return ElectionDetail;
};
