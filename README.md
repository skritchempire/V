# Shelter11 Telegram Mini App

Проект перенесён из `Shelter11.html` в структуру на React + Vite и подготовлен для Telegram Mini App.

## Запуск локально

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

Готовые файлы будут в `dist/`.

## Публикация в GitHub

1. Создайте репозиторий на GitHub и добавьте remote:
   ```bash
   git remote add origin <your_repo_url>
   git push -u origin work
   ```
2. Включите GitHub Pages (ветка `work` / папка `/root` или через Actions).
3. Укажите HTTPS URL в BotFather как Mini App URL.

## Telegram

В `index.html` уже подключён SDK:

- `https://telegram.org/js/telegram-web-app.js`

В `src/main.jsx` вызываются:

- `Telegram.WebApp.ready()`
- `Telegram.WebApp.expand()`

Это даёт базовую инициализацию внутри Telegram клиента.
