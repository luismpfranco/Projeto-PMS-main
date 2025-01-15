module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const CampaignRequest = sequelize.define('CampaignRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        status: { // needs to be re-evaluated which implies rejecting a request
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            allowNull: false,
            defaultValue: 'Pending',
        },
    }, {
        freezeTableName: true,
        timestamps: true
    });

    return CampaignRequest;
};