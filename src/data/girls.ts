export interface GirlProfile {
  id: number
  name: string
  age: number
  bio: string
  tags: string[]
  image?: string
  color: string
  /** 1–3 — «острота» профиля (перчики на карточке) */
  rating: number
}

const imageModules = import.meta.glob<string>('@/assets/girls/*/*.png', {
  eager: true,
  import: 'default',
})

const imagesById = Object.fromEntries(
  Object.entries(imageModules)
    .map(([path, url]) => {
      const match = path.match(/girls\/(\d+)\//)
      return match ? [Number(match[1]), url] as const : null
    })
    .filter((entry): entry is [number, string] => entry !== null),
) as Record<number, string>

const GIRL_ROWS: Omit<GirlProfile, 'image'>[] = [
  {
    id: 1,
    name: 'Алина',
    age: 30,
    bio: 'Учительница литературы. Люблю порядок, умных людей и вечерние разговоры за кофе.',
    tags: ['Книги', 'Кофе', 'Путешествия'],
    color: '#7d5a3a',
    rating: 2,
  },
  {
    id: 2,
    name: 'Неона',
    age: 22,
    bio: 'Уличный фотограф с дерзким характером. Обожаю неоновые улицы и живые эмоции.',
    tags: ['Музыка', 'Ночные прогулки', 'Фотография'],
    color: '#3a4a6e',
    rating: 3,
  },
  {
    id: 3,
    name: 'Миу',
    age: 19,
    bio: 'Милая художница, постоянно рисую в блокноте и немного стесняюсь новых знакомств.',
    tags: ['Аниме', 'Игры', 'Рисование'],
    color: '#6b4856',
    rating: 1,
  },
  {
    id: 4,
    name: 'Вероника',
    age: 27,
    bio: 'Уверенная бизнесвумен. Люблю дорогие рестораны и сильных мужчин.',
    tags: ['Бизнес', 'Фитнес', 'Вино'],
    color: '#8a5a4a',
    rating: 3,
  },
  {
    id: 5,
    name: 'Кира',
    age: 24,
    bio: 'Яркая блогерша с огромной энергией и любовью к трендам.',
    tags: ['Танцы', 'TikTok', 'Мода'],
    color: '#7a4a7a',
    rating: 2,
  },
  {
    id: 6,
    name: 'Юки',
    age: 21,
    bio: 'Тихая девушка с загадочной улыбкой. Обожаю японскую культуру.',
    tags: ['Манга', 'Чай', 'Косплей'],
    color: '#4a3a4a',
    rating: 1,
  },
  {
    id: 7,
    name: 'Виктория',
    age: 29,
    bio: 'Сильная и независимая. Люблю скорость, свободу и рок-музыку.',
    tags: ['Авто', 'Рок-музыка', 'Байки'],
    color: '#5a3030',
    rating: 3,
  },
  {
    id: 8,
    name: 'Оля',
    age: 20,
    bio: 'Очень смешливая — всегда отправляю мемы ночью.',
    tags: ['Кино', 'Попкорн', 'Мемы'],
    color: '#6a5030',
    rating: 2,
  },
  {
    id: 9,
    name: 'Алина',
    age: 26,
    bio: 'Спокойная и добрая. Ищу гармонию во всём.',
    tags: ['Йога', 'Медитация', 'Природа'],
    color: '#5a6a4a',
    rating: 1,
  },
  {
    id: 10,
    name: 'Рина',
    age: 23,
    bio: 'Эмоциональная стримерша. Люблю соревнования и громко смеяться.',
    tags: ['Киберспорт', 'Стримы', 'Энергетики'],
    color: '#3a3a6a',
    rating: 2,
  },
  {
    id: 11,
    name: 'София',
    age: 31,
    bio: 'Утончённая, с красивой речью и спокойным характером.',
    tags: ['Искусство', 'Театр', 'Классическая музыка'],
    color: '#4a3a5a',
    rating: 1,
  },
  {
    id: 12,
    name: 'Катя',
    age: 18,
    bio: 'Стеснительная студентка — краснею почти от любого комплимента.',
    tags: ['Учёба', 'Кошки', 'Сериалы'],
    color: '#6a5548',
    rating: 1,
  },
  {
    id: 13,
    name: 'Диана',
    age: 25,
    bio: 'Люблю вечеринки и всегда оказываюсь в центре внимания.',
    tags: ['Танцы', 'Клубы', 'Коктейли'],
    color: '#5a4a6a',
    rating: 3,
  },
  {
    id: 14,
    name: 'Мила',
    age: 28,
    bio: 'Очень заботливая — постоянно готовлю что-то вкусное.',
    tags: ['Кулинария', 'Выпечка', 'Домашний уют'],
    color: '#7a5a40',
    rating: 2,
  },
  {
    id: 15,
    name: 'Луна',
    age: 22,
    bio: 'Немного странная, но милая. Верю в судьбу и звёзды.',
    tags: ['Астрология', 'Таро', 'Звёзды'],
    color: '#4a3a6a',
    rating: 2,
  },
  {
    id: 16,
    name: 'Дарья',
    age: 24,
    bio: 'Умею поддержать разговор на любую тему и внимательно слушаю.',
    tags: ['Психология', 'Подкасты', 'Книги'],
    color: '#3a4a4a',
    rating: 1,
  },
  {
    id: 17,
    name: 'Алёна',
    age: 20,
    bio: 'Очень эмоциональная. Люблю внимание и комплименты.',
    tags: ['Шопинг', 'Музыка', 'Фото'],
    color: '#7a4a6a',
    rating: 2,
  },
  {
    id: 18,
    name: 'Рокси',
    age: 23,
    bio: 'Свободолюбивая, с сильным характером и необычным стилем.',
    tags: ['Татуировки', 'Рок', 'Фестивали'],
    color: '#2a2a2a',
    rating: 3,
  },
  {
    id: 19,
    name: 'Нова',
    age: 20,
    bio: 'Геймерша из будущего — стримы, VR и всё самое новое.',
    tags: ['Стримы', 'VR', 'Технологии'],
    color: '#2a4a6a',
    rating: 2,
  },
  {
    id: 20,
    name: 'Изабелла',
    age: 29,
    bio: 'Люблю роскошь, эстетику и красивые вечера.',
    tags: ['Верховая езда', 'Вечерние платья', 'Искусство'],
    color: '#1a1a2a',
    rating: 2,
  },
]

export const GIRLS: GirlProfile[] = GIRL_ROWS.map((girl) => ({
  ...girl,
  image: imagesById[girl.id],
}))

export function getGirlById(id: number): GirlProfile | undefined {
  return GIRLS.find((g) => g.id === id)
}
