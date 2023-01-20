'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VoterLogins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Status: {
        type: Sequelize.BOOLEAN
      },
      VoterId: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      UserRole: {
        type: Sequelize.STRING
      },
      userElectionId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('VoterLogins');
  }
};