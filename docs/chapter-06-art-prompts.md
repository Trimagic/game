# Глава 06 — Лифт не для нас

Создано встроенным image_gen. Референс внешности и стиля: public/art/chapter-05-comic.png.
Итоговые файлы: public/art/chapter-06-comic.png и public/art/chapter-06-sprites.png.
У спрайтов проверен прозрачный альфа-канал. Границы регионов в StairsGame.tsx соответствуют фактическому расположению рисунков.

## Комикс

Use case illustration-story. Reference is identity/style only. New four-panel 2x2 comic page, portrait 1024x1536 with equal panels and horizontal gutter at 768. Same sturdy adult pale ginger curly-haired bearded protagonist in white T-shirt dark shorts sneakers. Rich European ink comic with halftone, ivory orange teal, friendly satire. Panel1 leaves gym with bag reflecting proudly. Panel2 stands between elevator and stairwell in apartment lobby. Panel3 confidently walks toward staircase carrying grocery bag with green watermelon visibly poking out. Panel4 looks up intimidating endless stairs, then at heavy watermelon with comic dismay. Keep face clear, no text no letters no speech bubbles. Upper and lower margins of each panel reserved for HTML captions. Preserve character identity. No injury or body shaming.

## Спрайты

Use case stylized-concept. Game sprite atlas transparent background, landscape 1536x1024, EXACT 3 columns by 2 rows equal cells with generous empty margins no grid lines. Use reference only for style and identity. European ink comic, clear bold outlines, teal orange ivory. Each object fully contained inside its cell, no shadows outside object. Top left: full body sturdy ginger curly-haired bearded adult man white T-shirt dark shorts sneakers holding grocery bag with watermelon, jumping with knees bent, facing right. Top middle: same man descending in jump legs extended holding same bag, facing right. Top right: same man standing happily with bag. Bottom left: cute orange cat in side view running. Bottom middle: brown grocery paper bag with green watermelon poking out. Bottom right: friendly elderly male neighbor in cardigan standing holding apartment door open (door included). No text, no letters, no backgrounds. Small mobile platformer readable silhouettes.

## Уточнение спрайтов

Edit this sprite sheet. Remove ALL colored background completely to actual transparent alpha, no backdrop, no glow or gradients. Rearrange the six subjects into EXACT equal grid 3 columns x2 rows on 1536x1024 canvas. Every subject must fit completely within its own 512x512 cell with 30px margin on all sides. Top row three full-body ginger hero poses. Bottom row cat, grocery bag, neighbor with door. Preserve ink style and identities. Do not crop any feet. Empty space must be transparent.
