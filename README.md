# Между кадрами — Telegram Mini App

Основа игры на 10 глав: **React + TypeScript + Vite + Phaser**, **Cloudflare Workers Static Assets**, прогресс в **D1**.

Это стартовый прототип: все 10 глав используют одну демонстрационную мини-игру. Сюжет, иллюстрации и уникальные механики ещё не добавлены.

## Локальный запуск

Требуется Node.js 22.12+ (рекомендуется 24).

```sh
npm ci
npm run db:local
npm run dev
```

В браузере доступен деморежим с отдельным localStorage. В Telegram используется только серверный прогресс; ошибки API не подменяются локальным сохранением.

Для проверки Telegram локально создай `.dev.vars` (он исключён из Git):

```dotenv
BOT_TOKEN=your_bot_token
```

Нужен HTTPS-адрес, доступный Telegram, например через туннель. Токен бота никогда не помещать в `VITE_*`, клиентский код или Git.

## Cloudflare Workers

```sh
npx wrangler login
npx wrangler d1 create game-progress
```

Замени нулевой `database_id` в `wrangler.jsonc` на ID созданной базы. Нулевой ID — заглушка для локальной разработки.

```sh
npm run db:remote
npx wrangler secret put BOT_TOKEN
npm run deploy
```

В BotFather укажи HTTPS-адрес Worker для Mini App / кнопки меню бота. Для Git-интеграции Cloudflare Workers: build command `npm run build`, deploy command `npx wrangler deploy`. До первого деплоя настрой D1 и секрет.

## Проверки

```sh
npm test
npm run build
npm run test:integration
```

Интеграционные проверки запускают настоящий Workers runtime с изолированной D1: авторизация, порядок глав, повторные и конкурентные записи, изоляция пользователей.

## Структура

- `src/App.tsx` — карта, комикс, переходы и сохранение.
- `src/Game.tsx` — Phaser, загружается при входе в мини-игру и уничтожается при выходе.
- `src/telegram.ts` — Telegram API и отдельный браузерный деморежим.
- `worker/auth.ts` — HMAC-проверка initData, срок действия 24 часа.
- `worker/index.ts` — GET/POST `/api/progress`; ID пользователя берётся из проверенной подписи.
- `migrations/` — схема D1.

Прогресс хранится как количество последовательно завершённых глав. Повторная запись идемпотентна; атомарное обновление не позволяет пропустить главу или уменьшить прогресс. Клиент сообщает о победе сам: это сохранение прохождения, а не античит для призов или соревновательных рейтингов.

Авторизация с истёкшим initData требует повторного открытия приложения. Облачное развёртывание требует доступа к аккаунту Cloudflare и токена Telegram-бота.
