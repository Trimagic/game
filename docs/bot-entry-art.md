# Два экрана бота

До запуска: прежнее вступление перенесено в BOT_DESCRIPTION (plain text). Картинка для BotFather → Edit Bot → Edit Description Picture: `public/art/bot-description-cover.jpg`, 640×360. Исходник: `public/art/bot-description-cover.png`. Установка картинки через BotFather не выполнена: доступ Computer Use к приложению Telegram не разрешён. Bot API меняет описание текстом, но не description picture: https://core.telegram.org/bots/features#about-text-description-and-profile-media

После `/start`: новая сцена-приглашение `public/art/bot-start-invitation.jpg` и короткий призыв к действию с кнопкой «🎮 Старт». Исходник: `public/art/bot-start-invitation.png`.

Обе картинки созданы встроенным imagegen. JPEG — преобразование формата; изображение для BotFather дополнительно уменьшено до 640×360.

## Промпт сцены после запуска

Create a NEW landscape 3:2 Telegram bot welcome illustration, a call to start a playful birthday comic adventure. Input image is character and vintage comic style reference ONLY, not an edit target. Keep the same young chubby friendly ginger curly-haired bearded blue-eyed man in orange T-shirt. A fresh dynamic scene: waist-up hero at the threshold of an open teal doorway, one hand holding a small cream gamepad, other hand inviting the viewer toward a sunlit golden path beyond the doorway. His expression is a mischievous warm 'come on, let's go!' smile. A few large confetti shapes, one small birthday bunting at top. No cake, no 28 candles, no repeated logo badge, no sports, shops, clocks or future game spoilers. Warm cream paper, deep teal and orange-gold palette, bold expressive dark ink outlines, hand-colored vintage graphic novel rendering matching reference. Clear composition and silhouette even at Telegram message width. NO TEXT, NO LETTERS, NO BUTTONS, no panels, no UI. Full-frame polished inviting illustration.

## Промпт картинки до запуска

Edit target: the attached Happy Birthday square avatar badge. Adapt it into a WIDE 16:9 Telegram bot DESCRIPTION PICTURE. Preserve the entire existing circular Happy Birthday emblem, hero, cake with 28 candles, gamepad and exact lettering. Scale the complete original badge to fit comfortably within the HEIGHT of the new 16:9 canvas with breathing room top and bottom, centered horizontally. Extend the canvas left and right with matching deep teal vintage paper and just a few tasteful gold confetti flecks. Do not crop, distort, redraw or omit any part of the circular emblem or lettering. Do not add new text or new objects. Clean symmetrical landscape composition suitable for final downsampling to 640 by 360 pixels.
