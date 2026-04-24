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

## Кастомные изображения (комнаты и персонажи)

Положите файлы в `public/assets`:

- Комнаты: `public/assets/rooms/*.webp`
- Персонажи: `public/assets/chars/*.webp`

Ожидаемые имена комнат:

- `living.webp`
- `generator.webp`
- `filter.webp`
- `reservoir.webp`
- `farm.webp`
- `medbay.webp`
- `bar.webp`
- `armory.webp`
- `warehouse.webp`
- `lab.webp`
- `garage.webp`
- `turret.webp`
- `radio.webp`
- `guard.webp`
- `project.webp`

Ожидаемые имена персонажей:

- `leader.webp`
- `normis.webp`
- `soy.webp`
- `skuf.webp`
- `gigachad.webp`
- `mutant_worker.webp`
- `mutant_combat.webp`
- `mutant_psi.webp`
- `sick.webp`
- `cyborg.webp`

Если какого-то файла нет, визуал жителя автоматически откатится к встроенному старому виду.

Подробное ТЗ (описания всех комнат и персонажей для генерации) см. в `ASSET_BRIEF_RU.md`.
