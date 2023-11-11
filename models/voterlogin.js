"use strict";
const { Model } = require("sequelize");
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
    static getVotersList(id) {
      return this.findAll({
        where: {
          userElectionId: id,
        },
      });
    }

    static getVotersListById(id) {
      return this.findAll({
        where: {
          id,
        },
      });
    }
    static removeVoter(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static removeParticularVoter(id) {
      return this.destroy({
        where: {
          userElectionId: id,
        },
      });
    }
    static getTotalVoters(id) {
      return this.findAll({
        where: {
          userElectionId: id,
        },
        order: [["id", "ASC"]],
      });
    }

    static getRemVoters(id) {
      return this.findAll({
        where: {
          userElectionId: id,
          Status: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static getSuccessVoters(id) {
      return this.findAll({
        where: {
          userElectionId: id,
          Status: true,
        },
        order: [["id", "ASC"]],
      });
    }
    static getVoter(VoterId) {
      return this.findOne({
        where: {
          VoterId,
        },
        order: [["id", "ASC"]],
      });
    }

    static getParticularVoter(id) {
      return this.findOne({
        where: {
          VoterId: id,
        },
      });
    }

    updateVoterPass(pass) {
      return this.update({
        password: pass,
      });
    }
    Voted() {
      return this.update({
        Status: true,
      });
    }
  }
  VoterLogin.init(
    {
      Status: DataTypes.BOOLEAN,
      VoterId: DataTypes.STRING,
      password: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      userElectionId: DataTypes.INTEGER,
      UserRole: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "VoterLogin",
    }
  );
  return VoterLogin;
};
