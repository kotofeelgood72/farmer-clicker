export interface DialogChoice {
  text: string
}

export interface DialogNode {
  id: number
  speaker: string
  text: string
  choices: DialogChoice[]
  affection: number
  emotion: string
}

export interface GirlDialog {
  girlId: number
  nodes: DialogNode[]
}
