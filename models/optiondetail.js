"use strict";
const { Model } = require("sequelize");
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
    static getOptionList(id) {
      return this.findAll({
        where: {
          OptionId: id,
        },
      });
    }

    static removeOption(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    updateOption(title) {
      return this.update({
        OptionTitle: title,
      });
    }
  }
  OptionDetail.init(
    {
      OptionTitle: DataTypes.STRING,
      OptionId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "OptionDetail",
    }
  );
  return OptionDetail;
};
