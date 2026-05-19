export interface AvatarOption {
  id: string
  url: string
}

const modules = import.meta.glob<string>('@/assets/avatars/*.png', {
  eager: true,
  import: 'default',
})

export const AVATARS: AvatarOption[] = Object.entries(modules)
  .map(([path, url]) => {
    const match = path.match(/(\d+)\.png$/)
    return { id: match?.[1] ?? path, url }
  })
  .sort((a, b) => Number(a.id) - Number(b.id))
