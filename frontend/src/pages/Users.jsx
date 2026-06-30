import { useEffect, useState } from 'react'
import { usersAPI } from '../services/api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = () => {
    setLoading(true)
    setError('')
    usersAPI.list()
      .then((res) => {
        setUsers(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to fetch registered users.')
        setLoading(false)
      })
  }

  const handleToggleStaff = (id, currentVal) => {
    setError('')
    setSuccess('')
    usersAPI.update(id, { is_staff: !currentVal })
      .then((res) => {
        setUsers(prev => prev.map(u => u.id === id ? res.data : u))
        setSuccess(`Successfully updated role for ${res.data.username}.`)
        setTimeout(() => setSuccess(''), 3000)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to update user role.')
      })
  }

  const handleToggleActive = (id, currentVal) => {
    setError('')
    setSuccess('')
    usersAPI.update(id, { is_active: !currentVal })
      .then((res) => {
        setUsers(prev => prev.map(u => u.id === id ? res.data : u))
        setSuccess(`Successfully updated status for ${res.data.username}.`)
        setTimeout(() => setSuccess(''), 3000)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to update user status.')
      })
  }

  const handleDeleteUser = (id) => {
    setError('')
    setSuccess('')
    usersAPI.delete(id)
      .then(() => {
        setUsers(prev => prev.filter(u => u.id !== id))
        setSuccess('User record permanently removed.')
        setDeleteConfirm(null)
        setTimeout(() => setSuccess(''), 3000)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to delete user.')
        setDeleteConfirm(null)
      })
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b41e1]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="border-b border-[#c6c6cd] dark:border-[#333d52]/50 pb-4">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff]">group</span>
          User Management Control Panel
        </h2>
        <p className="text-xs text-[#76777d] dark:text-[#a0a5b5]">
          Manage registered analyst accounts, audit roles, and system permission levels
        </p>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/35 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d] text-lg">search</span>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/60 dark:border-[#333d52]/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-sm"
          />
        </div>
        <div className="text-xs text-[#76777d] dark:text-[#a0a5b5] font-semibold">
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0c101b]/30 border-b border-[#c6c6cd]/30 dark:border-[#333d52]/30 text-[#45464d] dark:text-[#a0a5b5] font-bold">
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role / Permissions</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/30 dark:divide-[#333d52]/30">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#f6f3f5]/30 dark:hover:bg-[#1c2436]/20 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-[#4b41e1] dark:text-[#7f78ff] flex items-center justify-center font-bold text-xs">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    {u.username}
                  </td>
                  <td className="p-4 text-[#76777d] dark:text-[#a0a5b5] font-mono">{u.email}</td>
                  <td className="p-4 text-[#76777d] dark:text-[#a0a5b5]">{u.phone || '—'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStaff(u.id, u.is_staff)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                        u.is_staff
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/20'
                      }`}
                    >
                      {u.is_staff ? 'Government Analyst (Admin)' : 'Field Analyst'}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDeleteConfirm(u)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/25 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Remove User"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#76777d] dark:text-[#a0a5b5]">
                    No users match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Delete User Account?</h3>
                <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1.5 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white font-mono">{deleteConfirm.username}</span>? This action is permanent and will delete their entire history.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#45464d] dark:text-[#dae2fd] py-2.5 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm.id)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-md active:scale-95"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
