# 梦角 DreamCorner 个人空间

## 应用概览
一个以"梦角"为主题的个人空间网站，模拟手机界面形态，以聊天对话框为主要交互方式，融合塔罗牌占卜、日记、朋友圈、日程经期提醒、网易云音乐等功能。整体采用圆角磨砂半透明质感，营造梦幻、温柔的氛围。

## 设计方向
- **视觉风格**：磨砂玻璃质感（Glassmorphism）+ 紫色梦幻渐变背景 + 大圆角卡片
- **布局形态**：手机竖屏布局（居中的手机容器，390px 左右宽度），底部 Tab 导航
- **主色调**：梦幻紫（Lavender / Purple）+ 粉色调 + 星光点缀
- **质感关键词**：磨砂半透明、模糊背景、柔光、渐变光晕

### 设计 Token
- 背景：紫色渐变 + 模糊光晕装饰
- 卡片：`backdrop-blur-xl` + 半透明白色/紫色 + 细边框
- 圆角：`rounded-3xl` (24px) 主卡片，`rounded-2xl` 次级
- 主色：紫粉渐变 `from-violet-400 to-pink-400`
- 文字：深色为主，白色用在深色背景卡上

## 数据模型
所有数据通过服务端数据库持久化存储。

### 表清单
1. **tarot_draws** - 塔罗抽牌记录
   - id, card_name, is_reversed, position, message, created_at
   
2. **diary_entries** - 梦角日记
   - id, title, content, mood, date, created_at

3. **moments** - 朋友圈
   - id, content, images(json), likes, created_at

4. **schedules** - 日程提醒
   - id, title, description, date_time, is_done, created_at

5. **period_records** - 经期记录
   - id, start_date, end_date, cycle_length, period_length, notes, created_at

6. **dream_chat_messages** - 梦角聊天消息
   - id, role(user/dream), content, tarot_card_id(可空), created_at

## 模块路由
- `/` - 首页（梦角聊天对话主界面）
- `/tarot` - 塔罗牌抽取
- `/diary` - 梦角日记
- `/moments` - 朋友圈
- `/schedule` - 日程与经期提醒
- `/music` - 网易云音乐

## 技术要点
- 前端：React 19 + TypeScript + Tailwind CSS + Glassmorphism 风格
- 后端：NestJS + Drizzle ORM + PostgreSQL
- 交互：聊天对话框式（类似 iMessage/微信），梦角以 AI 身份回应
- 塔罗牌：78 张标准塔罗牌数据，正逆位随机，配合梦角解读
