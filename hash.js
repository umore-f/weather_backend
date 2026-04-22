const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);      // 与模型中的 saltRounds 一致
const hash = bcrypt.hashSync('123456', salt);
console.log(hash);  // 输出类似 $2a$10$...