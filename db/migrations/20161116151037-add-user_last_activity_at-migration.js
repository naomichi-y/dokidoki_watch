'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      'users',
      'last_activity_at',
      {
        type: Sequelize.DATE,
        after: 'refresh_token'
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('users', 'last_activity_at')
  }
};
