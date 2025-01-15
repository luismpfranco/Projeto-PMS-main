module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const CampaignCreatorRequest = sequelize.define('CampaignCreatorRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        identificationDocument: {
            type: DataTypes.BLOB,
            allowNull: false,
        },
        status: { // needs to be re-evaluated which implies rejecting a request
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            allowNull: false,
            defaultValue: 'Pending',
        },
        campaignCreatorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'User',
                key: 'id',
            },
            allowNull: false,
            onDelete: 'CASCADE',
        },
    }, {
        freezeTableName: true,
        timestamps: true
    });

    CampaignCreatorRequest.associate = (models) => {
        CampaignCreatorRequest.belongsTo(models.User, {
            foreignKey: 'campaignCreatorId',
            as: 'campaignCreator',
        });
    };

    return CampaignCreatorRequest;
};
