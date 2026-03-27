---
description: 通用开发任务 - 启动开发服务器、构建、代码检查、依赖安装等常用操作
---

// turbo-all

## 启动开发服务器

1. 在项目根目录启动 Next.js 开发服务器
```
npm run dev
```

## 安装依赖

2. 安装项目依赖
```
npm install
```

## 代码检查

3. 运行 ESLint 检查代码
```
npm run lint
```

## 构建项目

4. 构建 Next.js 生产版本
```
npm run build
```

## 数据库操作

5. 推送数据库 schema 变更（Prisma/Supabase）
```
npx prisma db push
```

6. 生成 Prisma 客户端
```
npx prisma generate
```

## 查看项目信息

7. 查看已安装依赖
```
npm list --depth=0
```

8. 查看 package.json 中的所有脚本
```
npm run
```

## 类型检查

9. 运行 TypeScript 类型检查
```
npx tsc --noEmit
```
