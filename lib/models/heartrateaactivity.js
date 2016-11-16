'use strict'

module.exports = (sequelize, DataTypes) => {
    let HeartrateActivity = sequelize.define('HeartrateActivity', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: DataTypes.FALSE
        },
        bpm: {
            type: DataTypes.INTEGER,
            allowNull: DataTypes.FALSE
        },
        activity_at: {
            type: DataTypes.DATE,
            allowNull: DataTypes.FALSE
        }
    }, {
        underscored: true,
        underscoredAll: true,
        classMethods: {
            associate: models => {
                HeartrateActivity.belongsTo(models.User)
            }
        }
    })

    return HeartrateActivity
}
