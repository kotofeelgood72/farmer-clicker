export interface DialogChoice {
  text: string
}

export interface DialogNode {
  id: number
  speaker: string
  text: string
  /** Индекс файла в `girls/<id>/gallery/<n>.jpg` для сообщений `[фото]` */
  photoIndex?: number
  choices: DialogChoice[]
  affection: number
  emotion: string
}

export interface GirlDialog {
  girlId: number
  nodes: DialogNode[]
}
