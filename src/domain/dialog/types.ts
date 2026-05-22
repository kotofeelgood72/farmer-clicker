export interface DialogChoice {
  text: string
}

export interface DialogNode {
  id: number
  speaker: string
  text: string
  /** Индекс файла в `girls/<id>/gallery/<n>.png` для сообщений `[фото]` */
  photoIndex?: number
  choices: DialogChoice[]
  affection: number
  emotion: string
}

export interface GirlDialog {
  girlId: number
  nodes: DialogNode[]
}
