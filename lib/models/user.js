'use strict'

module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING, allowNull: DataTypes.FALSES
        },
        fitbit_id: {
            type: DataTypes.STRING, allowNull: DataTypes.FALSES
        },
        timezone: {
            type: DataTypes.STRING, allowNull: DataTypes.FALSES
        },
        access_token: {
            type: DataTypes.STRING, allowNull: DataTypes.FALSES
        },
        refresh_token: {
            type: DataTypes.STRING, allowNull: DataTypes.FALSES
        }
    }, {
        underscored: true,
        underscoredAll: true,
        classMethods: {
            associate: models => {
                User.hasMany(models.HeartrateActivity)
            },
            updateToken: (id, access_token, refresh_token) => {
                return User.update({
                    access_token: access_token,
                    refresh_token: refresh_token,
                }, {
                    where: { id: id }
                })
            }
        }
    })

    return User
}
