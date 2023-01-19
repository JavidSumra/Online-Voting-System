'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.addColumn("Votings","userId",{
        type:Sequelize.DataTypes.INTEGER,
      });

      await queryInterface.addConstraint("Votings",{
        fields:["userId"],
        type:"foreign key",
        references:{
          table:"VotingAdmins",
          field:"id",
        }
      });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.removeColumn("Votings","userId");
  }
};
