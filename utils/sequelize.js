const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize({ dialect: 'sqlite', storage: './db/database.sqlite' });

const models = {};

fs.readdirSync(path.join(__dirname, '../models'))
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
        const model = require(path.join(__dirname, '../models/', file))(sequelize, DataTypes);
        models[model.name] = model;
    });


Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

sequelize.sync()
    .then(() => console.log('DB synced successfully'))
    .catch(err => console.error('Error syncing DB:', err));

//TODO make this mess cleaner:
// Uncomment to create root admin 
// obs: run the programm once without uncommenting to have the database then after uncommenting and running once, comment it again  
//models.User.create({ username:"root", password: "root", role: "root_administrator" });

module.exports = { sequelize, models };