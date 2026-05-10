import { NavLink } from 'react-router-dom'
import { getUser, clearUser } from '../api/auth'

export default function NavBar() {
  const user = getUser()
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">SportsAnalysis</NavLink>
      <NavLink to="/soccer">Soccer</NavLink>
      <NavLink to="/volleyball">Volleyball</NavLink>
      <NavLink to="/basketball">Basketball</NavLink>
      <NavLink to="/esports">Esports</NavLink>
      <NavLink to="/favorites">Favorites</NavLink>
      <span className="spacer" />
      {user ? (
        <>
          <span className="muted">{user.nickname || user.username}</span>
          <a href="/" onClick={(e) => { e.preventDefault(); clearUser(); window.location.href = '/' }}>Logout</a>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </nav>
  )
}
