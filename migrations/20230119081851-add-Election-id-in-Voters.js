'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Voters","userElectionId",{
      type:Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Voters",{
      fields:["userElectionId"],
      type:"foreign key",
      references:{
        table:"Votings",
        field:"id",
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Voters","userElectionId");
  }
};
