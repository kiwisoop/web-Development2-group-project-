import { useEffect, useMemo, useState } from 'react'
import { fetchFavorites, removeFavorite } from '../api/favorites'
import { getUser } from '../api/auth'

const SPORT_LABEL = {
  BASEBALL: 'MLB Favorite Team',
  SOCCER: 'Soccer Favorite Team',
  BASKETBALL: 'Basketball Favorite Team',
  VOLLEYBALL: 'Volleyball Favorite Team',
  ESPORTS: 'Esports Favorite Team',
}

const SPORT_ORDER = ['BASEBALL', 'SOCCER', 'BASKETBALL', 'VOLLEYBALL', 'ESPORTS']

export default function FavoriteTeamsPage() {
  const user = getUser()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('ALL')

  const load = () => {
    if (!user) return
    fetchFavorites(user.id).then(setItems).catch(() => {})
  }
  useEffect(load, [])

  const onRemove = async (id) => {
    await removeFavorite(id)
    load()
  }

  const grouped = useMemo(() => {
    const map = {}
    for (const it of items) {
      const k = it.sportType || 'OTHER'
      if (!map[k]) map[k] = []
      map[k].push(it)
    }
    return map
  }, [items])

  const sportsPresent = useMemo(() => {
    const keys = Object.keys(grouped)
    return SPORT_ORDER.filter(s => keys.includes(s)).concat(
      keys.filter(k => !SPORT_ORDER.includes(k))
    )
  }, [grouped])

  if (!user) return <p>Login required to view favorites.</p>

  const visibleSports = filter === 'ALL' ? sportsPresent : sportsPresent.filter(s => s === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Favorite Teams</h2>
        <span className="spacer" style={{ flex: 1 }} />
        {items.length > 0 && (
          <>
            <span className="muted">Filter:</span>
            <button
              className={`btn ${filter === 'ALL' ? 'primary' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({items.length})
            </button>
            {sportsPresent.map(s => (
              <button
                key={s}
                className={`btn ${filter === s ? 'primary' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s} ({grouped[s].length})
              </button>
            ))}
          </>
        )}
      </div>

      {items.length === 0 && (
        <div className="notice" style={{ textAlign: 'center', padding: 24 }}>
          You have no favorite teams yet. Star a team from a match detail page to add one.
        </div>
      )}

      {visibleSports.map(sport => (
        <section key={sport} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{SPORT_LABEL[sport] || sport}</h3>
            <span className={`sport-chip ${sport === 'BASEBALL' ? 'baseball' : ''}`}>
              {grouped[sport].length}
            </span>
          </div>
          <div className="grid cards-3">
            {grouped[sport].map(f => (
              <div key={f.id} className="card fav-card">
                <div className="fav-head">
                  <h3>{f.teamName}</h3>
                  <span className={`sport-chip ${sport === 'BASEBALL' ? 'baseball' : ''}`}>
                    {sport}
                  </span>
                </div>
                <div className="fav-sub">
                  {SPORT_LABEL[sport] || sport}
                </div>
                <div>
                  <button
                    className="btn ghost-danger"
                    onClick={() => onRemove(f.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
