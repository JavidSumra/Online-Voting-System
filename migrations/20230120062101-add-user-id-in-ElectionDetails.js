'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn("ElectionDetails","userId",{
    type:Sequelize.DataTypes.INTEGER,
   });

   await queryInterface.addConstraint("ElectionDetails",{
    fields:["userId"],
    type:"foreign key",
    references:{
      table:"VotingAdmins",
      field:"id",
    }
   });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.removeColumn("ElectionDetails","userId");
  }
};
