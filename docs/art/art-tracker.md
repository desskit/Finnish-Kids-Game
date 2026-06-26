# Art tracker

Live checklist of every custom-art asset. **Do not edit the status column by hand for
needed/uploaded** — it is recomputed from `public/` by `npm run art:manifest`. You *may*
set a status to `approved` or `wired`; those are preserved across runs. The CSV
(`art-tracker.csv`) opens in any spreadsheet.

| Category | Total | ✅ Uploaded | ⬜ Needed |
| --- | ---: | ---: | ---: |
| item | 84 | 0 | 84 |
| numeral | 10 | 0 | 10 |
| color | 7 | 0 | 7 |
| theme-icon | 8 | 0 | 8 |
| chapter-icon | 8 | 0 | 8 |
| activity-icon | 9 | 0 | 9 |
| mascot | 10 | 0 | 10 |
| avatar | 12 | 0 | 12 |
| badge | 9 | 0 | 9 |
| ui-glyph | 10 | 0 | 10 |
| app-icon | 5 | 4 | 1 |
| **total** | **172** | **4** | **168** |

## item (84)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | cat | `art/animals/cat.webp` | webp | required | 🐱 |  |
| ⬜ | dog | `art/animals/dog.webp` | webp | required | 🐶 |  |
| ⬜ | bear | `art/animals/bear.webp` | webp | required | 🐻 |  |
| ⬜ | bunny | `art/animals/bunny.webp` | webp | required | 🐰 |  |
| ⬜ | bird | `art/animals/bird.webp` | webp | required | 🐦 |  |
| ⬜ | fish | `art/animals/fish.webp` | webp | required | 🐟 |  |
| ⬜ | horse | `art/animals/horse.webp` | webp | required | 🐴 |  |
| ⬜ | cow | `art/animals/cow.webp` | webp | required | 🐮 |  |
| ⬜ | pig | `art/animals/pig.webp` | webp | required | 🐷 |  |
| ⬜ | fox | `art/animals/fox.webp` | webp | required | 🦊 |  |
| ⬜ | duck | `art/animals/duck.webp` | webp | required | 🦆 |  |
| ⬜ | frog | `art/animals/frog.webp` | webp | required | 🐸 |  |
| ⬜ | bread | `art/food/bread.webp` | webp | required | 🍞 |  |
| ⬜ | milk | `art/food/milk.webp` | webp | required | 🥛 |  |
| ⬜ | water | `art/food/water.webp` | webp | required | 💧 |  |
| ⬜ | apple | `art/food/apple.webp` | webp | required | 🍎 |  |
| ⬜ | banana | `art/food/banana.webp` | webp | required | 🍌 |  |
| ⬜ | cheese | `art/food/cheese.webp` | webp | required | 🧀 |  |
| ⬜ | cake | `art/food/cake.webp` | webp | required | 🍰 |  |
| ⬜ | cookie | `art/food/cookie.webp` | webp | required | 🍪 |  |
| ⬜ | juice | `art/food/juice.webp` | webp | required | 🧃 |  |
| ⬜ | ice-cream | `art/food/ice-cream.webp` | webp | required | 🍦 |  |
| ⬜ | chocolate | `art/food/chocolate.webp` | webp | required | 🍫 |  |
| ⬜ | potato | `art/food/potato.webp` | webp | required | 🥔 |  |
| ⬜ | strawberry | `art/food/strawberry.webp` | webp | required | 🍓 |  |
| ⬜ | carrot | `art/food/carrot.webp` | webp | required | 🥕 |  |
| ⬜ | mother | `art/family/mother.webp` | webp | required | 👩 | kawaii human |
| ⬜ | father | `art/family/father.webp` | webp | required | 👨 | kawaii human |
| ⬜ | brother | `art/family/brother.webp` | webp | required | 🧑 | kawaii human |
| ⬜ | sister | `art/family/sister.webp` | webp | required | 👧 | kawaii human |
| ⬜ | baby | `art/family/baby.webp` | webp | required | 👶 | kawaii human |
| ⬜ | son | `art/family/son.webp` | webp | required | 👦 | kawaii human |
| ⬜ | daughter | `art/family/daughter.webp` | webp | required | 👧 | kawaii human |
| ⬜ | grandmother | `art/family/grandmother.webp` | webp | required | 👵 | kawaii human |
| ⬜ | grandfather | `art/family/grandfather.webp` | webp | required | 👴 | kawaii human |
| ⬜ | family | `art/family/family.webp` | webp | required | 👪 | kawaii human |
| ⬜ | box | `art/places/box.webp` | webp | required | 📦 |  |
| ⬜ | table | `art/places/table.webp` | webp | required | 🍽️ |  |
| ⬜ | house | `art/places/house.webp` | webp | required | 🏠 |  |
| ⬜ | room | `art/places/room.webp` | webp | required | 🚪 |  |
| ⬜ | car | `art/places/car.webp` | webp | required | 🚗 |  |
| ⬜ | bed | `art/places/bed.webp` | webp | required | 🛏️ |  |
| ⬜ | chair | `art/places/chair.webp` | webp | required | 🪑 |  |
| ⬜ | school | `art/places/school.webp` | webp | required | 🏫 |  |
| ⬜ | tree | `art/places/tree.webp` | webp | required | 🌳 |  |
| ⬜ | forest | `art/places/forest.webp` | webp | required | 🌲 |  |
| ⬜ | basket | `art/places/basket.webp` | webp | required | 🧺 |  |
| ⬜ | bag | `art/places/bag.webp` | webp | required | 👜 |  |
| ⬜ | eye | `art/body/eye.webp` | webp | required | 👁️ |  |
| ⬜ | ear | `art/body/ear.webp` | webp | required | 👂 |  |
| ⬜ | nose | `art/body/nose.webp` | webp | required | 👃 |  |
| ⬜ | mouth | `art/body/mouth.webp` | webp | required | 👄 |  |
| ⬜ | hand | `art/body/hand.webp` | webp | required | ✋ |  |
| ⬜ | foot | `art/body/foot.webp` | webp | required | 🦶 |  |
| ⬜ | head | `art/body/head.webp` | webp | required | 🙂 |  |
| ⬜ | tooth | `art/body/tooth.webp` | webp | required | 🦷 |  |
| ⬜ | hair | `art/body/hair.webp` | webp | required | 💇 |  |
| ⬜ | tummy | `art/body/tummy.webp` | webp | required | 🤰 |  |
| ⬜ | finger | `art/body/finger.webp` | webp | required | 👆 |  |
| ⬜ | knee | `art/body/knee.webp` | webp | required | 🦵 |  |
| ⬜ | sun | `art/nature/sun.webp` | webp | required | ☀️ |  |
| ⬜ | moon | `art/nature/moon.webp` | webp | required | 🌙 |  |
| ⬜ | star | `art/nature/star.webp` | webp | required | ⭐ |  |
| ⬜ | cloud | `art/nature/cloud.webp` | webp | required | ☁️ |  |
| ⬜ | rain | `art/nature/rain.webp` | webp | required | 🌧️ |  |
| ⬜ | snow | `art/nature/snow.webp` | webp | required | ❄️ |  |
| ⬜ | flower | `art/nature/flower.webp` | webp | required | 🌸 |  |
| ⬜ | mountain | `art/nature/mountain.webp` | webp | required | ⛰️ |  |
| ⬜ | stone | `art/nature/stone.webp` | webp | required | 🪨 |  |
| ⬜ | lake | `art/nature/lake.webp` | webp | required | 🏞️ |  |
| ⬜ | sea | `art/nature/sea.webp` | webp | required | 🌊 |  |
| ⬜ | sky | `art/nature/sky.webp` | webp | required | 🌌 |  |
| ⬜ | shirt | `art/clothes/shirt.webp` | webp | required | 👕 |  |
| ⬜ | blouse | `art/clothes/blouse.webp` | webp | required | 👚 |  |
| ⬜ | coat | `art/clothes/coat.webp` | webp | required | 🧥 |  |
| ⬜ | shoe | `art/clothes/shoe.webp` | webp | required | 👟 |  |
| ⬜ | sock | `art/clothes/sock.webp` | webp | required | 🧦 |  |
| ⬜ | hat | `art/clothes/hat.webp` | webp | required | 👒 |  |
| ⬜ | dress | `art/clothes/dress.webp` | webp | required | 👗 |  |
| ⬜ | skirt | `art/clothes/skirt.webp` | webp | required | 👗 |  |
| ⬜ | glove | `art/clothes/glove.webp` | webp | required | 🧤 |  |
| ⬜ | scarf | `art/clothes/scarf.webp` | webp | required | 🧣 |  |
| ⬜ | cap | `art/clothes/cap.webp` | webp | required | 🧢 |  |
| ⬜ | boot | `art/clothes/boot.webp` | webp | required | 🥾 |  |

## numeral (10)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | one | `art/numbers/one.svg` | svg | optional | 1️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | two | `art/numbers/two.svg` | svg | optional | 2️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | three | `art/numbers/three.svg` | svg | optional | 3️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | four | `art/numbers/four.svg` | svg | optional | 4️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | five | `art/numbers/five.svg` | svg | optional | 5️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | six | `art/numbers/six.svg` | svg | optional | 6️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | seven | `art/numbers/seven.svg` | svg | optional | 7️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | eight | `art/numbers/eight.svg` | svg | optional | 8️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | nine | `art/numbers/nine.svg` | svg | optional | 9️⃣ | styled numeral — SVG or pure CSS |
| ⬜ | ten | `art/numbers/ten.svg` | svg | optional | 🔟 | styled numeral — SVG or pure CSS |

## color (7)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | red | `art/colors/red.svg` | svg | optional | 🟥 | optional swatch |
| ⬜ | blue | `art/colors/blue.svg` | svg | optional | 🟦 | optional swatch |
| ⬜ | yellow | `art/colors/yellow.svg` | svg | optional | 🟨 | optional swatch |
| ⬜ | green | `art/colors/green.svg` | svg | optional | 🟩 | optional swatch |
| ⬜ | black | `art/colors/black.svg` | svg | optional | ⬛ | optional swatch |
| ⬜ | white | `art/colors/white.svg` | svg | optional | ⬜ | optional swatch |
| ⬜ | brown | `art/colors/brown.svg` | svg | optional | 🟫 | optional swatch |

## theme-icon (8)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | animals | `art/themes/animals.svg` | svg | required | 🐾 |  |
| ⬜ | numbers | `art/themes/numbers.svg` | svg | required | 🔢 |  |
| ⬜ | food | `art/themes/food.svg` | svg | required | 🍎 |  |
| ⬜ | family | `art/themes/family.svg` | svg | required | 👪 |  |
| ⬜ | places | `art/themes/places.svg` | svg | required | 📍 |  |
| ⬜ | body | `art/themes/body.svg` | svg | required | 🧍 |  |
| ⬜ | nature | `art/themes/nature.svg` | svg | required | 🌳 |  |
| ⬜ | clothes | `art/themes/clothes.svg` | svg | required | 👕 |  |

## chapter-icon (8)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | first-words | `art/chapters/first-words.svg` | svg | required | 🔊 |  |
| ⬜ | naming | `art/chapters/naming.svg` | svg | required | 🧩 |  |
| ⬜ | where | `art/chapters/where.svg` | svg | required | 📍 |  |
| ⬜ | likes | `art/chapters/likes.svg` | svg | required | ❤️ |  |
| ⬜ | numbers-describe | `art/chapters/numbers-describe.svg` | svg | required | 🔢 |  |
| ⬜ | actions | `art/chapters/actions.svg` | svg | required | 🏃 |  |
| ⬜ | together | `art/chapters/together.svg` | svg | required | 🔀 |  |
| ⬜ | sentences | `art/chapters/sentences.svg` | svg | required | 📝 |  |

## activity-icon (9)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | listen | `art/ui/listen.svg` | svg | required | 🔊 |  |
| ⬜ | build | `art/ui/build.svg` | svg | required | 🧩 |  |
| ⬜ | count | `art/ui/count.svg` | svg | required | 🔢 | make visually distinct from the numbers theme icon |
| ⬜ | match | `art/ui/match.svg` | svg | required | 🎨 |  |
| ⬜ | conjugate | `art/ui/conjugate.svg` | svg | required | 🏃 |  |
| ⬜ | order | `art/ui/order.svg` | svg | required | 🔀 |  |
| ⬜ | spell | `art/ui/spell.svg` | svg | required | ⌨️ |  |
| ⬜ | review | `art/ui/review.svg` | svg | required | 🔁 |  |
| ⬜ | sentence | `art/ui/sentence.svg` | svg | required | 📝 |  |

## mascot (10)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | owl-idle | `art/mascot/owl-idle.webp` | webp | required | 🦉 | already generated — re-cut transparent |
| ⬜ | owl-celebrate | `art/mascot/owl-celebrate.webp` | webp | required | 🦊🎉 | already generated — re-cut transparent |
| ⬜ | owl-wave | `art/mascot/owl-wave.webp` | webp | required | 🦉 | already generated — re-cut transparent |
| ⬜ | owl-icon-master | `art/mascot/owl-icon-master.png` | png | required | 🦉 | high-res transparent master → feeds app icons |
| ⬜ | owl-happy | `art/mascot/owl-happy.webp` | webp | optional | 🦉 | correct-answer pose |
| ⬜ | owl-encourage | `art/mascot/owl-encourage.webp` | webp | optional | 🦉 | wrong-answer pose — warm, never scolding |
| ⬜ | owl-listening | `art/mascot/owl-listening.webp` | webp | optional | 🦉 | wing to ear — ties to the 🔊 prompt |
| ⬜ | owl-reading | `art/mascot/owl-reading.webp` | webp | optional | 🦉 | book — Spelling / Word-order |
| ⬜ | owl-pointing | `art/mascot/owl-pointing.webp` | webp | optional | 🦉 | directs attention |
| ⬜ | owl-sleeping | `art/mascot/owl-sleeping.webp` | webp | optional | 🦉 | idle / attract state |

## avatar (12)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | fox | `art/avatars/fox.webp` | webp | future | 🦊 | reuse animals art |
| ⬜ | owl | `art/avatars/owl.webp` | webp | future | 🦉 | reuse mascot |
| ⬜ | bear | `art/avatars/bear.webp` | webp | future | 🐻 | reuse animals art |
| ⬜ | cat | `art/avatars/cat.webp` | webp | future | 🐱 | reuse animals art |
| ⬜ | dog | `art/avatars/dog.webp` | webp | future | 🐶 | reuse animals art |
| ⬜ | bunny | `art/avatars/bunny.webp` | webp | future | 🐰 | reuse animals art |
| ⬜ | frog | `art/avatars/frog.webp` | webp | future | 🐸 | reuse animals art |
| ⬜ | panda | `art/avatars/panda.webp` | webp | future | 🐼 | net-new |
| ⬜ | lion | `art/avatars/lion.webp` | webp | future | 🦁 | net-new |
| ⬜ | tiger | `art/avatars/tiger.webp` | webp | future | 🐯 | net-new |
| ⬜ | koala | `art/avatars/koala.webp` | webp | future | 🐨 | net-new |
| ⬜ | penguin | `art/avatars/penguin.webp` | webp | future | 🐧 | net-new |

## badge (9)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | first-steps | `art/badges/first-steps.svg` | svg | future | 🌱 |  |
| ⬜ | stars-25 | `art/badges/stars-25.svg` | svg | future | ⭐ |  |
| ⬜ | stars-100 | `art/badges/stars-100.svg` | svg | future | 🌟 |  |
| ⬜ | words-10 | `art/badges/words-10.svg` | svg | future | 📚 |  |
| ⬜ | mastered-10 | `art/badges/mastered-10.svg` | svg | future | 🏆 |  |
| ⬜ | sharp | `art/badges/sharp.svg` | svg | future | 🎯 |  |
| ⬜ | level-up | `art/badges/level-up.svg` | svg | future | 🚀 |  |
| ⬜ | explorer | `art/badges/explorer.svg` | svg | future | 🗺️ |  |
| ⬜ | all-games | `art/badges/all-games.svg` | svg | future | 🎮 |  |

## ui-glyph (10)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ⬜ | speaker | `art/ui/speaker.svg` | svg | optional | 🔊 | replay/hear button — in every game |
| ⬜ | back | `art/ui/back.svg` | svg | optional | ⬅︎ | activity header back |
| ⬜ | settings | `art/ui/settings.svg` | svg | optional | ⚙ | grown-up button |
| ⬜ | lock | `art/ui/lock.svg` | svg | optional | 🔒 | parent gate |
| ⬜ | add | `art/ui/add.svg` | svg | optional | ➕ | add child |
| ⬜ | check | `art/ui/check.svg` | svg | optional | ✓ | correct feedback |
| ⬜ | crown | `art/ui/crown.svg` | svg | optional | 👑 | mastered node |
| ⬜ | sparkle | `art/ui/sparkle.svg` | svg | optional | ✨ | coming-soon |
| ⬜ | star | `art/ui/star.svg` | svg | optional | ⭐ | reward star / counter |
| ⬜ | mute | `art/ui/mute.svg` | svg | optional | 🔇 | audio unavailable |

## app-icon (5)

| | id | file | fmt | priority | placeholder | notes |
| :-: | --- | --- | --- | --- | :-: | --- |
| ✅ | icon-192 | `icons/icon-192.png` | png | required |  | generated from owl-icon-master via make-icons; placeholder present until then |
| ✅ | icon-512 | `icons/icon-512.png` | png | required |  | generated from owl-icon-master via make-icons; placeholder present until then |
| ⬜ | icon-maskable-512 | `icons/icon-maskable-512.png` | png | required |  | generated from owl-icon-master via make-icons; placeholder present until then |
| ✅ | apple-touch | `icons/apple-touch-icon.png` | png | required |  | generated from owl-icon-master via make-icons; placeholder present until then |
| ✅ | favicon | `favicon.svg` | svg | required |  | generated from owl-icon-master via make-icons; placeholder present until then |

