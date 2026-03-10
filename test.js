const { Sequelize } = require('sequelize');

// 方式1：通过参数传递
const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql' // 或其他数据库类型
});
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功.');
  } catch (error) {
    console.error('无法连接到数据库:', error);
  }
}

testConnection();

module.exports = sequelize;