export interface LobbyChatMessage {
  id: string
  name: string
  color: string
  text: string
  /** Сообщение «слева» или «справа» для разнообразия. */
  side: 'left' | 'right'
}

export const LOBBY_CHAT_MESSAGES: LobbyChatMessage[] = [
  { id: '1', name: 'Аня', color: '#ff6b9d', text: 'Привет! Я Аня, только зашла ✨', side: 'left' },
  { id: '2', name: 'Макс', color: '#5b3df0', text: 'Я из Казани, кто из Татарстана?', side: 'right' },
  { id: '3', name: 'Лена', color: '#5fb8ff', text: 'Сегодня такая погода — хочется гулять', side: 'left' },
  { id: '4', name: 'Кирилл', color: '#2ec76b', text: 'Кто смотрел новый сериал? без спойлеров!', side: 'right' },
  { id: '5', name: 'Соня', color: '#ffb83d', text: 'Я Соня, учусь на дизайнера 🎨', side: 'left' },
  { id: '6', name: 'Артём', color: '#6e3df0', text: 'Переехал в Москву месяц назад', side: 'right' },
  { id: '7', name: 'Мила', color: '#ff7a9a', text: 'Кто любит кофе — напишите +1', side: 'left' },
  { id: '8', name: 'Дима', color: '#3d8bff', text: 'Я из Новосиба, всем привет!', side: 'right' },
  { id: '9', name: 'Вика', color: '#b14bff', text: 'Ищу друзей для онлайн-игр вечером', side: 'left' },
  { id: '10', name: 'Илья', color: '#4a90d9', text: 'Кто был на концерте в пятницу?', side: 'right' },
  { id: '11', name: 'Настя', color: '#ff4d8e', text: 'Я Настя, обожаю путешествия ✈️', side: 'left' },
  { id: '12', name: 'Рома', color: '#7b61ff', text: 'С Питера — у нас сейчас белые ночи', side: 'right' },
  { id: '13', name: 'Алиса', color: '#ff9f6b', text: 'Кто-нибудь советует фильм на вечер?', side: 'left' },
  { id: '14', name: 'Паша', color: '#2a9d8f', text: 'Я Паша, работаю удалённо 💻', side: 'right' },
  { id: '15', name: 'Юля', color: '#e056fd', text: 'Всем доброго утра! ☀️', side: 'left' },
  { id: '16', name: 'Саша', color: '#5c6bc0', text: 'Я из Екб, кто ещё с Урала?', side: 'right' },
]
