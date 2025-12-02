# 🚀 快速修复指南

## 立即执行的步骤

### 1. 验证代码已更新 ✅

所有 API 路由已经正确使用 cookies API：
- ✅ `app/api/favorites/route.ts`
- ✅ `app/api/conversations/route.ts`
- ✅ `app/api/user/route.ts`
- ✅ `app/api/timeline/route.ts`
- ✅ `app/auth/callback/page.tsx` (已更新，添加了更好的错误处理)

### 2. 本地测试

```bash
# 清除构建缓存
rm -rf .next
rm -rf node_modules/.cache

# 重新构建
npm run build

# 启动本地服务器
npm run start

# 在另一个终端运行调试脚本
node debug-api.js
```

### 3. 部署到 Railway

#### 方法 A: 通过 Railway Dashboard

1. 登录 Railway Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Build**
4. 点击 **Clear Build Cache**
5. 返回 **Deployments**
6. 点击 **Redeploy** → **Deploy Latest Commit**

#### 方法 B: 通过 Git Push

```bash
# 确保所有更改已提交
git add .
git commit -m "fix: improve error handling for cookies and OAuth"

# 推送到 main 分支
git push origin main

# Railway 会自动部署
```

### 4. 验证部署

部署完成后：

1. **访问生产环境**
   ```
   https://megan.tonetown.ai
   ```

2. **打开浏览器控制台** (F12)
   - 检查是否有 cookies 错误
   - 检查是否有 OAuth PKCE 错误

3. **测试功能**
   - 尝试登录（Google OAuth）
   - 测试收藏功能
   - 测试对话保存功能

4. **检查 Railway 日志**
   - 进入 Railway Dashboard
   - 查看 **Deployments** → **Logs**
   - 确认没有构建错误

---

## 🔍 如果问题仍然存在

### 检查清单

- [ ] **代码已推送到 Git**
  ```bash
  git status
  git log --oneline -5
  ```

- [ ] **Railway 已重新部署**
  - 检查 Deployment History
  - 确认最新部署时间

- [ ] **构建缓存已清除**
  - Railway Settings → Build → Clear Build Cache

- [ ] **环境变量正确**
  - Railway Settings → Variables
  - 确认所有必需的环境变量已设置

- [ ] **Supabase 配置正确**
  - Authentication → URL Configuration
  - Site URL: `https://megan.tonetown.ai`
  - Redirect URLs: `https://megan.tonetown.ai/**`

### 调试命令

```bash
# 本地测试 API
node debug-api.js

# 检查构建
npm run build

# 检查类型错误
npx tsc --noEmit

# 检查 lint 错误
npm run lint
```

---

## 📞 需要帮助？

如果问题仍然存在，请提供：

1. **浏览器控制台截图**
   - 完整的错误信息
   - Network 面板中的失败请求

2. **Railway 日志**
   - 最近的部署日志
   - 运行时错误日志

3. **环境信息**
   - 浏览器类型和版本
   - 操作系统
   - 是否使用无痕模式

---

## ✅ 预期结果

修复后应该看到：

- ✅ 控制台无 cookies 错误
- ✅ OAuth 登录成功
- ✅ API 返回 200 OK（已登录时）
- ✅ 所有功能正常工作

---

**最后更新**: 2024-12-19






