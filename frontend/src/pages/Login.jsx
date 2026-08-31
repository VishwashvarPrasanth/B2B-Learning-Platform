import { useState } from "react";
import api from '../services/api';

function Login(){
    const [formData, setFormData] = useState ({
        email:'',
        password: '',
        role: 'user',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>{
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

      const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
          const response = await api.post('/auth/login', formData)
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))

          const token = response.data.token
          const role = response.data.user.role

          // admin goes directly to admin dashboard
          if (role === 'admin') {
            window.location.href = '/admin'
            return
          }

          // fetch full user profile to check onboarding step
          const meRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })

          const fullUser = meRes.data.user
          const step = fullUser.onboardingStep

          if (step === 'completed') {
            // fully onboarded → go to dashboard
            window.location.href = '/dashboard'
          } else if (step === 'assessment' && fullUser.onboardingCourseId) {
            // chose course but didn't finish assessment
            window.location.href = `/assessment/${fullUser.onboardingCourseId}`
          } else {
            // didn't choose course yet
            window.location.href = '/courses'
          }

        } catch (err) {
          setError(err.response?.data?.message || 'Login failed')
        } finally {
          setLoading(false)
        }
      }

      return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-white/5">
          <span className="font-black text-white text-base tracking-tight">B2B Learn.</span>
        <div className="flex gap-6">
          <span className="text-white/90 text-sm cursor-pointer hover:text-white/60 transition-colors">Platform</span>
          <span className="text-white/90 text-sm cursor-pointer hover:text-white/60 transition-colors">Docs</span>
        </div>
        <a href="/register" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-sm hover:bg-white/90 transition-colors">
          Get started
        </a>
      </nav>

       {/* top-left heading */}
      <div className="px-20 pt-16">
        <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
          Your Personalized<br />
          <em className="font-normal italic text-white/40" style={{ fontFamily: 'Georgia, serif' }}>
            Learning Platform.
          </em>
        </h2>
      </div>

      {/* content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-3">// sign in</p>
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight mb-1">Welcome back.</h1>
          <p className="text-xs text-white/35 mb-8">Continue to your learning dashboard.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-white/25 mt-6">
            No account?{' '}
            <a href="/register" className="text-white/55 hover:text-white transition-colors">Register</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login;
// export default Login;
