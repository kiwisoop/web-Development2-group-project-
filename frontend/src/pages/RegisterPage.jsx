import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, saveUser } from '../api/auth'

export default function RegisterPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', email: '', nickname: '' })
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const user = await register(form)
      saveUser(user)
      nav('/')
    } catch (ex) {
      setErr(ex?.response?.data?.error || 'Register failed')
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form className="form" onSubmit={submit}>
        <input placeholder="username" value={form.username}
               onChange={e => setForm({ ...form, username: e.target.value })} />
        <input placeholder="password" type="password" value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <input placeholder="email" value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="nickname" value={form.nickname}
               onChange={e => setForm({ ...form, nickname: e.target.value })} />
        <button className="btn primary" type="submit">Register</button>
        {err && <p style={{ color: 'salmon' }}>{err}</p>}
      </form>
    </div>
  )
}
