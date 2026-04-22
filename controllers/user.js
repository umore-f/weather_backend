const express = require('express');
const router = express.Router();
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// 用户注册
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名或邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    
    const user = await User.create({ username, email, password, is_life:1 });
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: user.id, username: user.username, email: user.email, is_life: user.is_life  }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, email: user.email, is_life: user.is_life }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户信息（需要认证）
router.get('/auth/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});


// 修改用户信息
router.put('/auth/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, password } = req.body;

    // 查找当前用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户名是否已被其他用户占用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: '用户名已被使用' });
      }
      user.username = username;
    }

    // 检查邮箱是否已被其他用户占用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: '邮箱已被使用' });
      }
      user.email = email;
    }

    // 如果提供了密码，则加密后更新
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // 返回更新后的用户信息（不含密码）
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      message: '个人信息更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});
module.exports = { router };