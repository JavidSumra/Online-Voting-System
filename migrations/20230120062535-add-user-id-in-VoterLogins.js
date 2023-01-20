'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("VoterLogins","userElectionId",{
      type:Sequelize.DataTypes.INTEGER,
     });
  
     await queryInterface.addConstraint("VoterLogins",{
      fields:["userElectionId"],
      type:"foreign key",
      references:{
        table:"ElectionDetails",
        field:"id",
      }
     });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("VoterLogins","userElectionId");
  }
};
