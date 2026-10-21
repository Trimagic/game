# Иллюстрации первого этапа

Созданы встроенным image_gen по фото, предоставленному пользователем. Исходное фото не включено в репозиторий.

## Комикс
Файл: public/art/chapter-01-comic.png

Use case: illustration-story. Create a polished four-panel comic page for a lighthearted sports adventure game, based on the attached man's likeness: ginger curly short hair, ginger beard, pale skin, broad face, sturdy build. Consistent recognizable protagonist in every panel. Bold dark ink outlines, expressive European comic illustration, warm ivory paper, halftone shading, orange and teal accents, friendly humor, not photorealistic. Portrait page, exactly four panels in 2x2 grid. Panel 1: full body man in white T-shirt and navy shorts steps onto bathroom scales, looking down. Panel 2: closer view of his face looking at scales thoughtfully, no numeric weight required. Panel 3: determined cheerful man putting on orange cycling helmet, ready to take care of himself. Panel 4: man riding teal bicycle through sunny neighborhood park, orange shirt navy shorts helmet, clear face in three quarter profile. Respectful positive self-care narrative, no body shaming. No text, no speech bubbles, no lettering; dialogue will be added in HTML. Clean panel gutters, all four panels fully visible.

## Атлас персонажей
Файл: public/art/chapter-01-sprites.png
Прозрачный фон. Области спрайтов заданы в src/Game.tsx по фактическим силуэтам.

Use case: illustration-story. Asset type: transparent game sprite atlas for a vertical bicycle dodging game. Use attached photo solely as likeness reference for the adult male cyclist: curly ginger hair and ginger beard, pale skin, sturdy build. Create ONE square image with FOUR equally sized cells in a precise 2x2 grid, transparent background throughout, no cell borders. Each sprite fully contained in its own quadrant with generous transparent padding, no overlap. TOP LEFT: full body ginger man riding a teal bicycle, orange sports T-shirt, navy shorts and orange helmet, front three-quarter view, both wheels visible, facing toward bottom of screen. TOP RIGHT: full body friendly elderly grandmother walking with grocery bag, violet cardigan, gray hair bun, facing viewer. BOTTOM LEFT: full body child walking holding a red ball, blue shirt yellow shorts, facing viewer. BOTTOM RIGHT: single large recognizable yellow banana peel on ground. Consistent bold black ink outlines, warm European comic style with restrained halftone shading, clear simple silhouettes suitable for small mobile game sprites, no text, no shadows extending outside cells. These are obstacles to AVOID; no crashes or violence. Four objects only. Output genuinely transparent alpha background.

