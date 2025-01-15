module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const Report = sequelize.define('Report', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        campaignId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Campaign',
                key: 'id',
            },
            allowNull: false,
            onDelete: 'CASCADE',
        },
        reporterId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'User',
                key: 'id',
            },
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        timestamps: true
    });

    Report.associate = (models) => {
        Report.belongsTo(models.Campaign, {
            foreignKey: 'campaignId',
            as: 'campaign',
        });
        Report.belongsTo(models.User, {
            foreignKey: 'reporterId',
            as: 'reporter',
        });
    };

    return Report;
};
