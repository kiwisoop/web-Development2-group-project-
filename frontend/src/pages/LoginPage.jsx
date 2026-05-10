import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, saveUser } from '../api/auth'

export default function LoginPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const user = await login(form)
      saveUser(user)
      nav('/')
    } catch (ex) {
      setErr(ex?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form className="form" onSubmit={submit}>
        <input placeholder="username" value={form.username}
               onChange={e => setForm({ ...form, username: e.target.value })} />
        <input placeholder="password" type="password" value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <button className="btn primary" type="submit">Login</button>
        {err && <p style={{ color: 'salmon' }}>{err}</p>}
        <p className="muted">No account? <Link to="/register">Register</Link></p>
        <p className="muted">Demo user: demo / demo123</p>
      </form>
    </div>
  )
}
