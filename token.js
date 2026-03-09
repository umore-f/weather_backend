// tokenManager.js
const { SignJWT, importPKCS8 } = require('jose');
require('dotenv').config();

let cachedToken = null;
let tokenExpiry = 0;

async function generateNewToken() {
  const privateKey = await importPKCS8(process.env.ED25519_PRIVATE_KEY.replace(/\\n/g, '\n'), 'EdDSA');
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 2*60*60; // token持续时间2h
  const token = await new SignJWT({ sub: process.env.PROJECT_ID, iat, exp })
    .setProtectedHeader({ alg: 'EdDSA', kid: process.env.KEY_ID })
    .sign(privateKey);
  cachedToken = token;
  tokenExpiry = exp;
  console.log('新 JWT 已生成，有效期至', new Date(exp * 1000));
  return token;
}

async function getValidToken() {
  // 如果 token 不存在或将在 5 分钟内过期，则重新生成
  if (!cachedToken || tokenExpiry - Math.floor(Date.now() / 1000) < 300) {
    return await generateNewToken();
  }
  return cachedToken;
}

module.exports = { getValidToken };