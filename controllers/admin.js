const express = require('express');
const router = express.Router();
const { Admin } = require('../models');
const jwt = require('jsonwebtoken');

// 管理员登录
router.post('/admin/login', async (req, res) => {
  try {

    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const isValid = await admin.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: '管理员登录成功',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取管理员信息（需要认证）
router.get('/admin/profile', require('../middleware/auth'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }
    const admin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = { router };