import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { authAPI, dashboardAPI } from '../services/api'

export default function Profile() {
  const { user, setUser } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Edit fields
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Avatar state
  const [avatar, setAvatar] = useState('')
  const fileInputRef = useRef(null)

  // Tab State
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'security' | 'session'

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setPhone(user.phone || '')

      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`user_avatar_${user.id}`)
      if (savedAvatar) {
        setAvatar(savedAvatar)
      }
      
      // Fetch stats
      dashboardAPI.stats()
        .then((res) => {
          setStats(res.data)
          setLoadingStats(false)
        })
        .catch(() => setLoadingStats(false))
    }
  }, [user])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB to prevent localStorage size limits
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setAvatar(base64String)
      localStorage.setItem(`user_avatar_${user.id}`, base64String)
      
      // Notify Layout component of change
      window.dispatchEvent(new Event('avatar_changed'))
      setSuccessMsg('Profile picture updated successfully!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = (e) => {
    e.stopPropagation() // Prevent triggering file input click
    setAvatar('')
    localStorage.removeItem(`user_avatar_${user.id}`)
    window.dispatchEvent(new Event('avatar_changed'))
    setSuccessMsg('Profile picture removed')
  }

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')
    
    let cleanPhone = ''
    if (phone && phone.trim() !== '') {
      cleanPhone = phone.replace(/\D/g, '')
    }
    
    setIsUpdating(true)
    authAPI.updateMe({ email, phone: cleanPhone })
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        setSuccessMsg('Profile details updated successfully!')
        setIsUpdating(false)
      })
      .catch((err) => {
        let msg = 'Failed to update profile details'
        if (err.response?.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            msg = err.response.data.detail.map(d => d.msg).join(', ')
          } else {
            msg = err.response.data.detail
          }
        }
        setErrorMsg(msg)
        setIsUpdating(false)
      })
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    setIsUpdating(true)
    authAPI.updateMe({ password })
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        setSuccessMsg('Password updated successfully!')
        setPassword('')
        setConfirmPassword('')
        setIsUpdating(false)
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.detail || 'Failed to change password')
        setIsUpdating(false)
      })
  }

  // Calculate Analyst Progression Level based on Scanned count
  const getProgressDetails = () => {
    const totalScans = stats?.total_articles || 0
    if (totalScans < 10) {
      return {
        level: 'Cadet Analyst (Lvl 1)',
        progress: (totalScans / 10) * 100,
        nextLevel: 'Field Analyst (Lvl 2)',
        scansNeeded: 10 - totalScans
      }
    } else if (totalScans < 50) {
      return {
        level: 'Field Analyst (Lvl 2)',
        progress: ((totalScans - 10) / 40) * 100,
        nextLevel: 'Senior Analyst (Lvl 3)',
        scansNeeded: 50 - totalScans
      }
    } else {
      return {
        level: 'Senior Analyst (Lvl 3)',
        progress: Math.min(((totalScans - 50) / 100) * 100, 100),
        nextLevel: 'Master Analyst (Lvl 4)',
        scansNeeded: Math.max(150 - totalScans, 0)
      }
    }
  }

  const progression = getProgressDetails()

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Title Section */}
      <div className="border-b border-[#c6c6cd] dark:border-[#333d52] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff]">account_circle</span>
            Account Dashboard
          </h2>
          <p className="text-xs text-[#76777d] dark:text-[#a0a5b5]">
            Configure security, profile details, and monitor analytical clearance progress
          </p>
        </div>
      </div>

      {/* Global Alerts Feed */}
      {(successMsg || errorMsg) && (
        <div className="max-w-full">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card & Progress Details */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Avatar & Cover Card */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] rounded-2xl shadow-sm overflow-hidden flex flex-col items-center text-center">
            {/* Elegant Tech Banner */}
            <div className="w-full h-24 bg-gradient-to-tr from-[#4b41e1] to-[#3323cc] dark:from-[#3323cc]/40 dark:to-[#0f0069]/40 relative">
              <div className="absolute top-3 left-3 bg-[#e2dfff]/20 dark:bg-white/10 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
                SYSTEM AGENT
              </div>
            </div>

            {/* Profile Avatar with file upload overlay */}
            <div className="relative -mt-12 group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4b41e1] to-[#3323cc] p-[3px] shadow-lg shadow-[#4b41e1]/20">
                <div className="w-full h-full rounded-full border-2 border-white dark:border-[#121824] bg-white dark:bg-[#121824] overflow-hidden relative">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#e2dfff] dark:bg-[#3323cc]/20 flex items-center justify-center text-[#3323cc] dark:text-[#7f78ff] font-bold text-3xl">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Camera upload overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                    <span>Change Photo</span>
                  </div>
                </div>
              </div>
              
              {/* Trash/delete photo button */}
              {avatar && (
                <button 
                  onClick={handleRemoveAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg border-2 border-white dark:border-[#121824] transition-all hover:scale-110 flex items-center justify-center"
                  title="Remove Profile Photo"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Profile Info Summary */}
            <div className="p-6 pt-3 space-y-1 w-full border-b border-[#c6c6cd]/30 dark:border-[#333d52]/50">
              <h3 className="font-bold text-black dark:text-white text-base flex items-center justify-center gap-1">
                {user?.username}
                {user?.is_staff && (
                  <span className="material-symbols-outlined text-sm text-[#4b41e1] dark:text-[#7f78ff]" title="Verified Administrator">
                    verified
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] truncate">{user?.email}</p>
              
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e2dfff] text-[#3323cc] dark:bg-[#4b41e1]/20 dark:text-[#7f78ff] mt-2">
                <span className="material-symbols-outlined text-[11px]">{user?.is_staff ? 'admin_panel_settings' : 'badge'}</span>
                {user?.is_staff ? 'Admin Access' : 'Analyst Clearance'}
              </div>
            </div>

            {/* Compact details items */}
            <div className="p-4 w-full text-xs space-y-2 text-left bg-[#f6f3f5]/20 dark:bg-[#151c2a]/20">
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#888b94] font-medium">Clearance Level</span>
                <span className="font-bold text-black dark:text-white">{user?.is_staff ? 'Level A (Admin)' : 'Level B (Analyst)'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#888b94] font-medium">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Agent
                </span>
              </div>
            </div>
          </div>

          {/* Progression Metrics Card */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] rounded-2xl p-5 shadow-sm text-left space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#76777d] dark:text-[#a0a5b5]">Cleared Progression</span>
              <h4 className="font-black text-black dark:text-white text-sm mt-0.5">{progression.level}</h4>
            </div>

            {/* Custom Premium Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#f6f3f5] dark:bg-[#1c2436] h-2.5 rounded-full overflow-hidden border border-[#c6c6cd]/30 dark:border-[#333d52]/40">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${progression.progress > 0 && progression.progress < 100 ? 'progress-shimmer' : 'bg-gradient-to-r from-[#4b41e1] to-[#3323cc]'}`}
                  style={{ width: `${progression.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-[#76777d] dark:text-[#888b94] uppercase tracking-wider">
                <span>{stats?.total_articles || 0} Scans Run</span>
                <span>{progression.progress.toFixed(0)}% Completion</span>
              </div>
            </div>

            {progression.scansNeeded > 0 ? (
              <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] bg-[#f6f3f5] dark:bg-[#1a2130] p-2.5 rounded-xl border border-[#c6c6cd]/30 dark:border-[#333d52]/20 leading-normal flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] text-[#4b41e1] dark:text-[#7f78ff] flex-shrink-0 mt-0.5">trending_up</span>
                <span>Run <strong>{progression.scansNeeded} more news scans</strong> to unlock next clearance tier: <strong>{progression.nextLevel}</strong>.</span>
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 leading-normal flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">workspace_premium</span>
                <span>You have reached maximum standard clearance ranking level!</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Settings & Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
            
            {/* Tabs Selector Navigation Bar */}
            <div className="flex border-b border-[#c6c6cd] dark:border-[#333d52] bg-[#f6f3f5] dark:bg-[#1a202e] px-6">
              <button 
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 py-4 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-[#4b41e1] text-[#4b41e1] dark:border-[#7f78ff] dark:text-[#7f78ff]'
                    : 'border-transparent text-[#76777d] hover:text-black dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Agent Details
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 py-4 px-1 ml-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-[#4b41e1] text-[#4b41e1] dark:border-[#7f78ff] dark:text-[#7f78ff]'
                    : 'border-transparent text-[#76777d] hover:text-black dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                Security Settings
              </button>
              <button 
                onClick={() => setActiveTab('session')}
                className={`flex items-center gap-2 py-4 px-1 ml-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'session'
                    ? 'border-[#4b41e1] text-[#4b41e1] dark:border-[#7f78ff] dark:text-[#7f78ff]'
                    : 'border-transparent text-[#76777d] hover:text-black dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">security</span>
                System Logs
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="text-left border-b border-[#c6c6cd]/25 dark:border-[#333d52]/20 pb-3">
                    <h4 className="font-bold text-black dark:text-white text-sm">Update Contact Credentials</h4>
                    <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Modify your registered email and phone contact details</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 text-left">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">
                          Email Address
                        </label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-[14px] group-focus-within:text-[#4b41e1] transition-colors">mail</span>
                          <input 
                            type="email" 
                            required
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-8 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] dark:focus:border-[#4b41e1] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">
                          Phone Number
                        </label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-[14px] group-focus-within:text-[#4b41e1] transition-colors">call</span>
                          <input 
                            type="text" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-8 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] dark:focus:border-[#4b41e1] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#c6c6cd]/20 dark:border-[#333d52]/20 flex justify-end">
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-[#4b41e1] to-[#3323cc] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:from-[#4b41e1]/90 hover:to-[#3323cc]/90 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#4b41e1]/20"
                      >
                        <span className="material-symbols-outlined text-sm">save</span>
                        {isUpdating ? 'Saving...' : 'Save Agent Details'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="text-left border-b border-[#c6c6cd]/25 dark:border-[#333d52]/20 pb-3">
                    <h4 className="font-bold text-black dark:text-white text-sm">Update Password</h4>
                    <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">For security, select a strong password combining special characters</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 text-left">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">
                          New Password
                        </label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-[14px] group-focus-within:text-[#4b41e1] transition-colors">key</span>
                          <input 
                            type="password" 
                            required
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-8 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] dark:focus:border-[#4b41e1] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#6b7280] text-[14px] group-focus-within:text-[#4b41e1] transition-colors">key</span>
                          <input 
                            type="password" 
                            required
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-8 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#76777d] dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#4b41e1]/30 focus:border-[#4b41e1] dark:focus:border-[#4b41e1] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#c6c6cd]/20 dark:border-[#333d52]/20 flex justify-end">
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-[#303032] to-[#1b1b1d] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:from-[#303032]/90 hover:to-[#1b1b1d]/90 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-black/10"
                      >
                        <span className="material-symbols-outlined text-sm">lock_reset</span>
                        {isUpdating ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'session' && (
                <div className="space-y-6 text-left">
                  <div className="border-b border-[#c6c6cd]/25 dark:border-[#333d52]/20 pb-3">
                    <h4 className="font-bold text-black dark:text-white text-sm">System Logs & Metadata</h4>
                    <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Details regarding current active browser session and encryption guidelines</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#f6f3f5]/50 dark:bg-[#1a2130]/50 p-4 rounded-xl border border-[#c6c6cd]/30 dark:border-[#333d52]/30 space-y-2">
                        <h5 className="font-bold text-[#4b41e1] dark:text-[#7f78ff] uppercase tracking-wider text-[9px]">Session details</h5>
                        <div className="space-y-1">
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">User Agent:</span> <span className="font-semibold truncate max-w-[120px]">{navigator.userAgent.split(' ')[0]}</span></p>
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">Language:</span> <span className="font-semibold">{navigator.language}</span></p>
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">Local Node:</span> <span className="font-mono text-[10px]">127.0.0.1:8765</span></p>
                        </div>
                      </div>

                      <div className="bg-[#f6f3f5]/50 dark:bg-[#1a2130]/50 p-4 rounded-xl border border-[#c6c6cd]/30 dark:border-[#333d52]/30 space-y-2">
                        <h5 className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[9px]">Encryption Protocol</h5>
                        <div className="space-y-1">
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">API Signature:</span> <span className="font-semibold">HMAC-SHA256</span></p>
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">Token Expiry:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">Valid</span></p>
                          <p className="flex justify-between"><span className="text-[#76777d] dark:text-[#888b94]">Policy Layer:</span> <span className="font-semibold">ISO-902 Compliant</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#121824] border border-amber-200/50 dark:border-amber-900/40 p-4 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
                      <div className="space-y-0.5 text-xs text-[#76777d] dark:text-[#a0a5b5] leading-normal">
                        <span className="font-bold text-black dark:text-white block">Audit Trail Access</span>
                        <span>This workstation log complies with national cybersecurity standards. All changes made to credentials, profile details, or scraping indexes are archived under security protocol.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
