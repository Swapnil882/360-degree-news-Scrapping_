import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { authAPI } from '../services/api'
import api from '../services/api'

const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters long and include a letter and a number.'

/**
 * Validates password strength on the client side (mirrors backend rules).
 * Returns an error string, or '' if valid.
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return PASSWORD_RULES_MESSAGE
  if (password.length < 8) return PASSWORD_RULES_MESSAGE
  if (!/[a-zA-Z]/.test(password)) return PASSWORD_RULES_MESSAGE
  if (!/\d/.test(password)) return PASSWORD_RULES_MESSAGE
  return ''
}

/**
 * Extracts a user-friendly error message from an Axios error.
 */
function extractErrorMessage(err, fallback) {
  if (!err || typeof err !== 'object') {
    return fallback
  }
  if (err.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Make sure the backend is running on port 8765.'
  }
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join(', ')
    }
    return String(detail)
  }
  return fallback
}

export default function Register() {
  const outletContext = useOutletContext() || {}
  const { user, setUser } = outletContext
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Check if the backend server is reachable
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/health', { signal: controller.signal })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setBackendOnline(false)
        }
      })
    return () => controller.abort()
  }, [])

  const searchParams = new URLSearchParams(location.search)
  const redirect = searchParams.get('redirect')
  const redirectUrl = searchParams.get('url')

  // If the user is already logged in, redirect them away from the register page
  useEffect(() => {
    if (user) {
      if (redirect === 'scraper' && redirectUrl) {
        navigate(`/scraper?url=${encodeURIComponent(redirectUrl)}`)
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, navigate, redirect, redirectUrl])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const username = form.username.trim()
    const email = form.email.trim().toLowerCase()

    // --- Client-side validation ---
    if (!username) {
      setError('Username is required.')
      return
    }

    if (!email) {
      setError('Email is required.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    const passwordError = validatePassword(form.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    let cleanPhone = ''
    if (form.phone && form.phone.trim() !== '') {
      cleanPhone = form.phone.replace(/\D/g, '')
    }

    setLoading(true)
    try {
      const res = await authAPI.register({
        username,
        email,
        password: form.password,
        phone: cleanPhone,
      })

      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      if (setUser) {
        setUser(res.data.user)
      }

      if (redirect === 'scraper' && redirectUrl) {
        navigate(`/scraper?url=${encodeURIComponent(redirectUrl)}`)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed. Please check your inputs and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[#f6f3f5] via-[#fcf8fa] to-[#eae7e9] dark:from-[#0b0f19] dark:via-[#121824] dark:to-[#0b0f19]">
      <div className="w-full max-w-md glass-panel border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#4b41e1] to-[#3323cc] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4b41e1]/20">
              <span className="material-symbols-outlined text-2xl text-white">person_add</span>
            </div>
            <h3 className="text-xl font-bold text-[#1b1b1d] dark:text-white">Create Account</h3>
            <p className="text-sm text-[#76777d] dark:text-[#a0a5b5]">Join the Civic Intelligence platform</p>
          </div>

          {!backendOnline && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl text-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">cloud_off</span>
              <div>
                <span className="font-bold block">Backend server unreachable</span>
                <span>Run: <code className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">uvicorn app.main:app --reload --port 8765</code> in <code className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">backend/</code></span>
              </div>
            </div>
          )}

          {error && (
            <div id="register-error-banner" className="mb-6 p-4 bg-[#ffdad6] dark:bg-[#93000a]/20 border border-[#ba1a1a]/20 text-[#93000a] dark:text-[#ffdad6] rounded-xl text-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">gpp_bad</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
            <div>
              <label htmlFor="register-username" className="block text-xs font-bold uppercase tracking-wider text-[#45464d] dark:text-[#a0a5b5] mb-1.5">Username</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-lg group-focus-within:text-[#4b41e1] transition-colors">person</span>
                <input 
                  id="register-username"
                  type="text" 
                  required 
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f5] dark:bg-[#1c2436] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl text-sm text-[#1b1b1d] dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] outline-none transition-all"
                  placeholder="Choose username"
                  value={form.username} 
                  onChange={(e) => setForm({ ...form, username: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-wider text-[#45464d] dark:text-[#a0a5b5] mb-1.5">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-lg group-focus-within:text-[#4b41e1] transition-colors">mail</span>
                <input 
                  id="register-email"
                  type="email" 
                  required 
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f5] dark:bg-[#1c2436] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl text-sm text-[#1b1b1d] dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] outline-none transition-all"
                  placeholder="name@agency.com"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-phone" className="block text-xs font-bold uppercase tracking-wider text-[#45464d] dark:text-[#a0a5b5] mb-1.5">Phone Number (optional)</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-lg group-focus-within:text-[#4b41e1] transition-colors">call</span>
                <input 
                  id="register-phone"
                  type="tel" 
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f5] dark:bg-[#1c2436] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl text-sm text-[#1b1b1d] dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] outline-none transition-all"
                  placeholder="1234567890"
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-[#45464d] dark:text-[#a0a5b5] mb-1.5">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-lg group-focus-within:text-[#4b41e1] transition-colors">key</span>
                <input 
                  id="register-password"
                  type="password" 
                  required 
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f5] dark:bg-[#1c2436] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl text-sm text-[#1b1b1d] dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] outline-none transition-all"
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#76777d] dark:text-[#6b7280] leading-snug">
                {PASSWORD_RULES_MESSAGE}
              </p>
            </div>

            <button 
              id="register-submit-btn"
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4b41e1] to-[#3323cc] text-white py-3 rounded-xl font-bold hover:from-[#4b41e1]/90 hover:to-[#3323cc]/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#4b41e1]/25 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-[#c6c6cd]/30 dark:border-[#333d52]/30">
            <p className="text-sm text-[#45464d] dark:text-[#a0a5b5]">
              Already have an account? <Link to="/login" className="font-bold text-[#4b41e1] hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
