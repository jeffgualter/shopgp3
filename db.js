const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('feed_produtos', 'feed_produtos_user', 
'LUndYbcuwxtLIrJkXnj39LfJtOaqHKlq', {
  host: 'dpg-cub7al52ng1s73amrd00-a.oregon-postgres.render.com',
  dialect: 'postgres', // Ou o banco de dados que você estiver usando
});

module.exports = sequelize;

