export interface AvatarOption {
  id: string
  url: string
}

const modules = import.meta.glob<string>('@/assets/avatars/*.jpg', {
  eager: true,
  import: 'default',
})

export const AVATARS: AvatarOption[] = Object.entries(modules)
  .map(([path, url]) => {
    const match = path.match(/(\d+)\.jpg$/i)
    return { id: match?.[1] ?? path, url }
  })
  .sort((a, b) => Number(a.id) - Number(b.id))
