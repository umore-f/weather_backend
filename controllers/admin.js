const express = require('express');
const router = express.Router();
const { Admin, User, UserSetting } = require('../models');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
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

// 获取所有用户（仅管理员）
router.get('/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'created_at', 'is_life'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error); 
    res.status(500).json({ message: '获取用户列表失败'}); 
  }
});

// 获取指定用户的设置（仅管理员）
router.get('/admin/users/:id/settings', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }
  try {
    const setting = await UserSetting.findOne({ where: { user_id: req.params.id } });
    if (!setting) {
      return res.json({ display_cities: [], weather_fields: [], data_sources: [], date_start: null, date_end: null });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: '获取用户设置失败' });
  }
});

router.put('/admin/users/:id/disable', authMiddleware, async (req, res) => {
  // 权限校验
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }

  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'is_life']
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 可选：防止管理员禁用自己
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: '不能禁用当前登录的管理员账户' });
    }

    // 如果已经是禁用状态，返回提示但视为成功
    if (user.is_life === 0) {
      return res.json({ message: '用户已被禁用', user: { id: user.id, username: user.username, is_life: 0 } });
    }

    // 更新 is_life 为 0
    await user.update({ is_life: 0 });

    res.json({
      message: '用户已禁用',
      user: { id: user.id, username: user.username, is_life: 0 }
    });
  } catch (error) {
    console.error('禁用用户失败:', error);
    res.status(500).json({ message: '服务器错误，禁用用户失败' });
  }
});

// 解除用户禁用（仅管理员）
router.put('/admin/users/:id/enable', authMiddleware, async (req, res) => {
  // 权限校验
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足' });
  }

  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'is_life']
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 如果已经是启用状态，返回提示但视为成功
    if (user.is_life === 1) {
      return res.json({ message: '用户已是启用状态', user: { id: user.id, username: user.username, is_life: 1 } });
    }

    // 更新 is_life 为 1
    await user.update({ is_life: 1 });

    res.json({
      message: '用户已解除禁用',
      user: { id: user.id, username: user.username, is_life: 1 }
    });
  } catch (error) {
    console.error('解除禁用失败:', error);
    res.status(500).json({ message: '服务器错误，解除禁用失败' });
  }
});
module.exports = { router };