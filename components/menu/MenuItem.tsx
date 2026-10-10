'use client'

interface MenuItemData {
  icon: string
  title: string
  description: string
  onClick: () => void
  delay?: number
}

export default function MenuItem({ icon, title, description, onClick, delay = 0 }: MenuItemData) {
  return (
    <div
      className="menu-item"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="menu-item-icon">{icon}</div>
      <div className="menu-item-title">{title}</div>
      <div className="menu-item-desc">{description}</div>
    </div>
  )
}
