module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: { // TODO change limit (eg. STRING(20), where 20 is caracters)
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: { // TODO change limit (eg. STRING(20), where 20 is caracters)
            type: DataTypes.STRING,
            allowNull: false,
        },
        picture: {
            type: DataTypes.BLOB,
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('administrator','campaign_creator','donor', 'root_administrator'), //needs to be properly defined
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        timestamps: true
    });

    return User;
};