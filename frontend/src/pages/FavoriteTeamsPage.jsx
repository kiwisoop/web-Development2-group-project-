import { useEffect, useState } from 'react'
import { fetchFavorites, removeFavorite } from '../api/favorites'
import { getUser } from '../api/auth'

export default function FavoriteTeamsPage() {
  const user = getUser()
  const [items, setItems] = useState([])

  const load = () => {
    if (!user) return
    fetchFavorites(user.id).then(setItems).catch(() => {})
  }
  useEffect(load, [])

  const onRemove = async (id) => {
    await removeFavorite(id)
    load()
  }

  if (!user) return <p>Login required to view favorites.</p>

  return (
    <div>
      <h2>Favorite Teams</h2>
      {items.length === 0 && <p className="muted">No favorites yet. Star a team from a match detail page.</p>}
      <div className="grid cards-3">
        {items.map(f => (
          <div key={f.id} className="card">
            <h3>{f.teamName}</h3>
            <p className="muted">{f.sportType}</p>
            <button className="btn danger" onClick={() => onRemove(f.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
