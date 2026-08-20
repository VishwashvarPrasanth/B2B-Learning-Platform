import { useState } from 'react'
import api from '../services/api'

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/register', formData)// store in db
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      //check role - admin goes to admin dashboard, User goes to assessment 
      const role = response.data.user.role
      window.location.href = role === 'admin' ? '/admin': '/assessment'
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <span className="font-black text-white text-sm tracking-tight">B2B Learn.</span>
        <a href="/login" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-sm hover:bg-white/90 transition-colors">
          Sign in
        </a>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-3">// new account</p>
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight mb-1">Join the platform.</h1>
          <p className="text-xs text-white/35 mb-8">Start your personalised learning journey.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">Full name</p>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Prasanth V."
                required
                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder-white/20"
              />
            </div>

            <div>
              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">Email</p>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder-white/20"
              />
            </div>

            <div>
              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">Password</p>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder-white/20"
              />
            </div>

            {/* role selector */}
            <div>
              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-2">Role</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`border rounded-sm py-2 text-center transition-all ${formData.role === 'user' ? 'border-white bg-white/5' : 'border-white/10'}`}
                >
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30">Role</p>
                  <p className={`text-sm font-bold ${formData.role === 'user' ? 'text-white' : 'text-white/30'}`}>Learner</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`border rounded-sm py-2 text-center transition-all ${formData.role === 'admin' ? 'border-white bg-white/5' : 'border-white/10'}`}
                >
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30">Role</p>
                  <p className={`text-sm font-bold ${formData.role === 'admin' ? 'text-white' : 'text-white/30'}`}>Admin</p>
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40 mt-1"
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
          // after registration → go to course selection
          window.location.href = role === 'admin' ? '/admin' : '/courses'

          <p className="text-center text-xs text-white/25 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-white/55 hover:text-white transition-colors">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register