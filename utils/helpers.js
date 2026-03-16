// 通用辅助函数

// 改变字段
// 实时天气 vc=>和风
function renameFields(originalData) {
  const { visibility, cloudcover, ...rest } = originalData;
  return {
    vis: visibility,
    cloud: cloudcover,
    ...rest
  };
}
module.exports = renameFields

