import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { authAPI, alertsAPI, scraperAPI } from '../services/api'

export default function Layout() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const navigate = useNavigate()
  const location = useLocation()

  // State for menus & settings
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [seenAlertIds, setSeenAlertIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('seen_alert_ids') || '[]')
    } catch { return [] }
  })

  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profilePassword, setProfilePassword] = useState('')
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [settingsError, setSettingsError] = useState('')

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('pref_dark_mode') === 'true'
  })
  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem('pref_auto_refresh') === 'true'
  })

  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('pref_dark_mode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('pref_dark_mode', 'false')
    }
  }, [darkMode])

  // Fetch alerts
  const fetchAlerts = () => {
    alertsAPI.list().then((res) => {
      const allAlerts = res.data.alerts || []
      setAlerts(allAlerts)
      const pendingCount = allAlerts.filter(a => a.status === 'pending' && !seenAlertIds.includes(a.id)).length
      setUnreadCount(pendingCount)
    }).catch(err => console.error(err))
  }

  const markAlertSeen = (alertId) => {
    setSeenAlertIds(prev => {
      if (prev.includes(alertId)) return prev
      const updated = [...prev, alertId]
      localStorage.setItem('seen_alert_ids', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = () => {
    const pendingIds = alerts.filter(a => a.status === 'pending').map(a => a.id)
    setSeenAlertIds(prev => {
      const updated = [...new Set([...prev, ...pendingIds])]
      localStorage.setItem('seen_alert_ids', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }

  // Load User details
  useEffect(() => {
    const token = localStorage.getItem('token')
    const isOnAuthPage = location.pathname === '/login' || location.pathname === '/register'
    
    if (isOnAuthPage) {
      return
    }

    if (!token) {
      setUser(null)
      return
    }

    const controller = new AbortController()
    authAPI.me({ signal: controller.signal }).then((res) => {
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    }).catch((err) => {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    })

    return () => {
      controller.abort()
    }
  }, [location.pathname])

  // Populate profile fields & poll alerts when user loads
  useEffect(() => {
    if (user) {
      setProfileEmail(user.email || '')
      setProfilePhone(user.phone || '')
      fetchAlerts()
      
      const interval = setInterval(() => {
        fetchAlerts()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  // Avatar handling
  const [avatar, setAvatar] = useState('')

  const loadAvatar = () => {
    if (user) {
      const savedAvatar = localStorage.getItem(`user_avatar_${user.id}`)
      setAvatar(savedAvatar || '')
    } else {
      setAvatar('')
    }
  }

  useEffect(() => {
    loadAvatar()
  }, [user])

  useEffect(() => {
    window.addEventListener('avatar_changed', loadAvatar)
    return () => window.removeEventListener('avatar_changed', loadAvatar)
  }, [user])

  // Auto-refresh interval
  useEffect(() => {
    if (!user || !autoRefresh) return
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [user, autoRefresh])

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your Civic Intel Assistant. Type a keyword or news headline to check if we have any reports or scanned intelligence details in our records.',
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Multilingual news categories mapping for cross-lingual searches
  const MULTILINGUAL_DICTIONARY = [
    {
      category: "violence",
      terms: [
        "violence", "incitement", "kill", "murder", "attack", "bomb", "shooting", "homicide", "assassination", "massacre", "stab",
        "हिंसा", "हत्या", "हमला", "मर्डर", "गोलीबारी", "बम", "धमाका", "आतंक", "अकस्मात", "घातपात",
        "खून", "हल्ला", "गोळीबार", "बॉम्ब", "दहशत", "घातक",
        "violencia", "asesinato", "ataque", "bomba", "disparo", "matar", "homicidio", "masacre"
      ]
    },
    {
      category: "unrest",
      terms: [
        "riot", "protest", "strike", "unrest", "civil unrest", "insurgency", "demonstration", "clash",
        "प्रदर्शन", "दंगा", "हड़ताल", "अशांति", "विद्रोह", "झड़प",
        "दंगल", "संप", "अशांतता", "मोर्चा", "आंदोलन",
        "protesta", "disturbio", "huelga", "revuelta", "choque", "manifestación"
      ]
    },
    {
      category: "hate",
      terms: [
        "hate", "discrimination", "bias", "prejudice", "racism", "communal", "sectarian",
        "नफरत", "भेदभाव", "साम्प्रदायिक", "पक्षपात",
        "द्वेष", "जातीय", "धार्मिक", "वाद",
        "odio", "discriminación", "prejuicio", "racismo", "comunal"
      ]
    },
    {
      category: "safety",
      terms: [
        "safety", "emergency", "accident", "crash", "danger", "disaster", "flood", "fire",
        "दुर्घटना", "आपातकाल", "खतरा", "आपदा", "बाढ़", "आग", "भूकंप",
        "अपघात", "आणीबाणी", "धोका", "पूर",
        "accidente", "emergencia", "peligro", "desastre", "inundación", "incendio"
      ]
    },
    {
      category: "abuse",
      terms: [
        "suicide", "abuse", "exploit", "harassment", "assault", "crime",
        "आत्महत्या", "उत्पीड़न", "शोषण", "अपराध", "जुर्म",
        "अत्याचार", "गुन्हा",
        "suicidio", "abuso", "explotación", "acoso", "asalto", "crimen"
      ]
    }
  ]

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatOpen, isTyping])

  const handleSendChatMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userQuery = chatInput.trim()
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userQuery,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)

    const queryLower = userQuery.toLowerCase().trim()

    // Check for basic conversational inputs
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'hola', 'sup', 'yo']
    const helpWords = ['help', 'info', 'support', 'what can you do', 'how to use', 'commands']
    const identityWords = ['who are you', 'your name', 'what are you', 'identity', 'who is this']

    const isGreeting = greetings.some(word => queryLower === word || queryLower.startsWith(word + ' '));
    const isHelp = helpWords.some(word => queryLower.includes(word));
    const isIdentity = identityWords.some(word => queryLower.includes(word));

    if (isGreeting || isHelp || isIdentity) {
      setTimeout(() => {
        setIsTyping(false)
        let replyText = ''
        if (isGreeting) {
          replyText = `Hello! I am your Civic Intel Assistant. 👋\n\nHow can I help you search or analyze scraped news intelligence today? Feel free to type any keyword or category (e.g., "violence", "accident", "protest") to query our database.`
        } else if (isIdentity) {
          replyText = `I am the Civic Intelligence Bot, a virtual assistant integrated into your workspace to help you monitor and search ingested intelligence, sentiment data, and high-risk alerts.`
        } else {
          replyText = `Here is how you can use me:\n\n1. **Search Keywords**: Enter any keyword or topic (e.g., "strike", "fire") to see matching scraped news articles.\n2. **Check Risk/Sentiment**: I will show the sentiment emoji (📈/📉/😐) and hazard risk level of each match.\n3. **Quick Help**: Type "help" or "info" to see this guide again.`
        }

        setChatMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date()
        }])
      }, 600)
      return
    }

    // Query scraper history
    scraperAPI.history()
      .then((res) => {
        const historyItems = res.data.items || []
        
        // Simulated chatbot response latency
        setTimeout(() => {
          setIsTyping(false)
          
          if (historyItems.length === 0) {
            // Database is empty
            setChatMessages(prev => [...prev, {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `Our database currently has no intelligence records.\n\n💡 **Tip**: Go to the **Ingest News** section on the home page and submit a news URL. I will automatically analyze its sentiment and threat risk, and populate the database!`,
              timestamp: new Date()
            }])
            return
          }
          
          // Build list of search terms (starts with user query)
          let searchTerms = [queryLower]
          
          // Find matching categories in the multilingual dictionary
          MULTILINGUAL_DICTIONARY.forEach(cat => {
            const hasMatch = cat.terms.some(term => 
              queryLower.includes(term.toLowerCase()) || 
              term.toLowerCase().includes(queryLower)
            )
            if (hasMatch) {
              // Expand search terms with all synonyms in the category
              searchTerms = [...searchTerms, ...cat.terms]
            }
          })
          
          // Remove duplicates and normalize terms
          const uniqueTerms = Array.from(new Set(searchTerms.map(t => t.toLowerCase().trim())))
          
          // Filter history items matching any of our expanded synonyms
          const matches = historyItems.filter(item => {
            const titleLower = (item.title || '').toLowerCase()
            const contentLower = (item.content || '').toLowerCase()
            
            return uniqueTerms.some(term => 
              titleLower.includes(term) || 
              contentLower.includes(term)
            )
          })

          if (matches.length > 0) {
            // Found matching intelligence records
            const matchCountText = matches.length === 1 ? '1 record' : `${matches.length} records`
            const resultsText = matches.slice(0, 3).map((item, idx) => {
              const sentimentEmoji = item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '😐'
              const threatLevel = item.is_harmful ? '⚠️ HIGH RISK' : '✅ LOW RISK'
              return `${idx + 1}. 📰 **${item.title}**\n   • Risk: ${threatLevel}\n   • Sentiment: ${sentimentEmoji} ${item.sentiment} (${(item.sentiment_score * 100).toFixed(0)}%)`
            }).join('\n\n')

            const responseText = `I found ${matchCountText} matching intelligence records in our database:\n\n${resultsText}${matches.length > 3 ? '\n\n*(Showing top 3 matches)*' : ''}`
            
            setChatMessages(prev => [...prev, {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: responseText,
              timestamp: new Date()
            }])
          } else {
            // Wrong info / Not present
            setChatMessages(prev => [...prev, {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `No matching intelligence records found for "${userQuery}" in our database.\n\n🔍 **Tip**: Try searching for general categories like **violence**, **safety**, **unrest**, or **abuse**.`,
              timestamp: new Date()
            }])
          }
        }, 800)
      })
      .catch((err) => {
        console.error(err)
        setTimeout(() => {
          setIsTyping(false)
          setChatMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'An error occurred while connecting to the intelligence database. Please try again.',
            timestamp: new Date()
          }])
        }, 800)
      })
  }

  const renderMessageText = (text, isUser) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        const index = match.index;
        const matchedText = match[0];
        
        if (index > lastIndex) {
          parts.push(line.substring(lastIndex, index));
        }
        
        if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
          parts.push(<strong key={index} className="font-bold">{matchedText.slice(2, -2)}</strong>);
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
          parts.push(<em key={index} className="italic opacity-90">{matchedText.slice(1, -1)}</em>);
        }
        
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      if (line.trim().startsWith('•')) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-2 pl-0.5 my-0.5">
            <span className={isUser ? "text-white" : "text-[#4b41e1] dark:text-[#7f78ff]"}>•</span>
            <span className="flex-1">{parts.length > 0 ? parts : line.substring(line.indexOf('•') + 1)}</span>
          </div>
        );
      }
      
      return (
        <div key={lineIdx} className={lineIdx > 0 ? "min-h-[1.2em]" : ""}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    setSettingsSuccess('')
    setSettingsError('')

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setSettingsError('Passwords do not match')
      return
    }

    setIsUpdatingProfile(true)
    const payload = {
      email: profileEmail,
      phone: profilePhone,
    }
    if (profilePassword) {
      payload.password = profilePassword
    }

    authAPI.updateMe(payload)
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        setSettingsSuccess('Profile updated successfully!')
        setProfilePassword('')
        setProfileConfirmPassword('')
        setIsUpdatingProfile(false)
      })
      .catch((err) => {
        setSettingsError(err.response?.data?.detail || 'Failed to update profile')
        setIsUpdatingProfile(false)
      })
  }

  return (
    <div className="min-h-screen bg-[#fcf8fa] dark:bg-[#0c101b] text-[#1b1b1d] dark:text-[#f3f0f2] font-sans antialiased flex flex-col transition-colors duration-200">
      {user ? (
        // Logged-In Layout with Sidebar
        <div className="flex flex-1">
          {/* SideNavBar */}
          <aside className="fixed left-0 top-0 h-full w-64 bg-[#131b2e] dark:bg-[#0b0f19] border-r border-[#c6c6cd] dark:border-[#222b3d] flex flex-col gap-2 p-6 z-50 transition-colors duration-200">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-[#dae2fd]">Civic Intelligence</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="material-symbols-outlined text-[13px] text-[#4b41e1]">
                  {user.is_staff ? 'admin_panel_settings' : 'badge'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#4b41e1]/10 text-[#4b41e1] dark:bg-[#4b41e1]/20 dark:text-[#7f78ff]">
                  {user.is_staff ? 'Government Analyst' : 'Field Analyst'}
                </span>
              </div>
            </div>
            
            <nav className="flex-1 space-y-1">
              <Link 
                to="/dashboard" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/dashboard') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">home</span>
                <span className="text-[12px] uppercase tracking-wider">Home</span>
              </Link>

              <Link 
                to="/analytics-dashboard" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/analytics-dashboard') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-[12px] uppercase tracking-wider">Dashboard</span>
              </Link>

              <Link 
                to="/hazard-portal" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/hazard-portal') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">explore</span>
                <span className="text-[12px] uppercase tracking-wider">Hazard Map</span>
              </Link>
              
              <Link 
                to="/scraper" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/scraper') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">analytics</span>
                <span className="text-[12px] uppercase tracking-wider">Analyze</span>
              </Link>

              <Link 
                to="/scraped-reports" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/scraped-reports') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">folder_open</span>
                <span className="text-[12px] uppercase tracking-wider">Reports</span>
              </Link>

              <Link 
                to="/sources" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/sources') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">rss_feed</span>
                <span className="text-[12px] uppercase tracking-wider">Sources</span>
              </Link>

              <Link 
                to="/history" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/history') 
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">history</span>
                <span className="text-[12px] uppercase tracking-wider">History</span>
              </Link>

              <Link 
                to="/alerts" 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive('/alerts') || location.pathname.startsWith('/alerts/')
                    ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                    : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                }`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="text-[12px] uppercase tracking-wider">Alerts</span>
              </Link>

              {user.is_staff && (
                <Link 
                  to="/users" 
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    isActive('/users') 
                      ? 'text-[#3323cc] bg-[#e2dfff] dark:bg-[#4b41e1] dark:text-white shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:bg-[#4b41e1] before:rounded-r-full dark:before:bg-white' 
                      : 'text-[#7c839b] hover:text-[#dae2fd] hover:bg-[#3f465c]/20'
                  }`}
                >
                  <span className="material-symbols-outlined">group</span>
                  <span className="text-[12px] uppercase tracking-wider">Users</span>
                </Link>
              )}
            </nav>

            <div className="pt-4 border-t border-[#7c839b]/20 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4b41e1] to-[#3323cc] p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-[#131b2e] dark:bg-[#0b0f19] overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#dae2fd] truncate">{user.username}</p>
                  <p className="text-[10px] text-[#7c839b] truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="flex items-center justify-center gap-2 w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                LOGOUT
              </button>
            </div>
          </aside>

          {/* Main Stage */}
          <div className="flex flex-col flex-1 pl-64 min-h-screen">
            {/* TopNavBar */}
            <header className="sticky top-0 w-full bg-[#fcf8fa] dark:bg-[#121824] border-b border-[#c6c6cd] dark:border-[#333d52] flex justify-between items-center h-16 px-6 z-40 transition-colors duration-200">
              <div className="flex items-center gap-4 flex-grow max-w-xl">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] dark:text-[#888b94]">search</span>
                  <input 
                    type="text" 
                    placeholder="Search datasets, reports, or policies..." 
                    className="w-full bg-[#f6f3f5] dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-lg pl-10 pr-4 py-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] dark:focus:border-[#7f78ff] outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                    className={`p-2 rounded-lg text-[#45464d] dark:text-[#a0a5b5] hover:text-black dark:hover:text-white hover:bg-[#eae7e9] dark:hover:bg-[#1e2638] transition-all relative cursor-pointer ${
                      isNotificationsOpen ? 'bg-[#eae7e9] dark:bg-[#1e2638] text-black dark:text-white' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#fcf8fa] dark:ring-[#121824] animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl shadow-xl z-50 overflow-hidden glass-panel dark:bg-[#121824]/90 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-[#c6c6cd] dark:border-[#333d52] flex justify-between items-center">
                        <span className="font-bold text-xs text-black dark:text-white">Recent Alerts</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); markAllRead() }}
                                className="text-[9px] font-bold text-[#4b41e1] dark:text-[#7f78ff] hover:underline cursor-pointer"
                              >
                                Mark all read
                              </button>
                              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded text-[9px] font-bold uppercase">
                                {unreadCount} New
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-[#c6c6cd]/30 dark:divide-[#333d52]/50">
                        {alerts.length > 0 ? (
                          alerts.slice(0, 4).map((alert) => (
                            <div 
                              key={alert.id} 
                              onClick={() => {
                                setIsNotificationsOpen(false)
                                markAlertSeen(alert.id)
                                navigate(`/alerts/${alert.id}`)
                              }}
                              className="px-4 py-3 hover:bg-[#f6f3f5] dark:hover:bg-[#1c2436] transition-colors cursor-pointer text-left"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase ${
                                  alert.status === 'escalated' ? 'text-red-500' : 'text-[#4b41e1] dark:text-[#7f78ff]'
                                }`}>
                                  {alert.status}
                                </span>
                                <span className="text-[9px] text-[#76777d] dark:text-[#888b94]">
                                  {new Date(alert.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-black dark:text-white truncate">
                                {alert.news_title}
                              </p>
                              <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] truncate mt-0.5">
                                {alert.reason}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-[#76777d] dark:text-[#a0a5b5] text-xs">
                            <span className="material-symbols-outlined text-emerald-500 mb-1">check_circle</span>
                            <p>No active alerts</p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-[#c6c6cd] dark:border-[#333d52] bg-[#f6f3f5] dark:bg-[#1a202e] text-center">
                        <Link 
                          to="/alerts" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block py-2.5 text-[10px] font-bold text-[#4b41e1] dark:text-[#7f78ff] hover:underline"
                        >
                          VIEW ALL ALERTS
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-8 w-[1px] bg-[#c6c6cd] dark:bg-[#333d52]"></div>
                
                {/* User Profile */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#eae7e9] dark:hover:bg-[#1e2638] transition-all cursor-pointer ${
                      isProfileOpen ? 'bg-[#eae7e9] dark:bg-[#1e2638]' : ''
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4b41e1] to-[#3323cc] p-[1px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-[#f6f3f5] dark:bg-[#121824] overflow-hidden flex items-center justify-center text-[#4b41e1] dark:text-white font-bold text-xs">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#1b1b1d] dark:text-white">{user.username}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#4b41e1]/10 text-[#4b41e1] dark:bg-[#4b41e1]/20 dark:text-[#7f78ff]">
                        {user.is_staff ? 'Admin' : 'Field'}
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-[16px] text-[#45464d] dark:text-[#a0a5b5] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>
                      keyboard_arrow_down
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-[#121824]/95 backdrop-blur-xl border border-[#c6c6cd]/60 dark:border-[#333d52]/60 rounded-xl shadow-2xl z-50 overflow-hidden animate-in">
                      <div className="px-4 py-3 border-b border-[#c6c6cd]/40 dark:border-[#333d52]/40">
                        <p className="text-xs font-bold text-black dark:text-white">{user.username}</p>
                        <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link 
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#45464d] dark:text-[#c6c6cd] hover:text-[#1b1b1d] dark:hover:text-white hover:bg-[#f6f3f5] dark:hover:bg-[#1c2436] rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-base">person</span>
                          Profile & Settings
                        </Link>
                        
                        <Link 
                          to="/scraped-reports" 
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#45464d] dark:text-[#c6c6cd] hover:text-[#1b1b1d] dark:hover:text-white hover:bg-[#f6f3f5] dark:hover:bg-[#1c2436] rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-base">folder_open</span>
                          Scraped Reports
                        </Link>

                        <Link 
                          to="/alerts" 
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#45464d] dark:text-[#c6c6cd] hover:text-[#1b1b1d] dark:hover:text-white hover:bg-[#f6f3f5] dark:hover:bg-[#1c2436] rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-base">warning</span>
                          Alerts Feed
                        </Link>
                      </div>
                      <div className="border-t border-[#c6c6cd]/40 dark:border-[#333d52]/40 p-1.5">
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false)
                            logout()
                          }} 
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-base">logout</span>
                          LOGOUT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Content Canvas */}
            <main className="flex-1 p-6">
              <Outlet context={{ user, setUser }} />
            </main>
          </div>
        </div>
      ) : (
        // Public Layout (Landing Page, Login, Register)
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 w-full bg-[#fcf8fa]/80 backdrop-blur-md border-b border-[#c6c6cd] flex justify-between items-center h-16 px-6 z-50">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#1b1b1d] hover:opacity-95">
              <span className="material-symbols-outlined text-[#4b41e1]">newspaper</span>
              <span>Civic Intelligence</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-[#45464d] hover:text-[#1b1b1d]">Home</Link>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-[#45464d] hover:text-[#1b1b1d] transition-all">Sign In</Link>
              <Link to="/register" className="bg-[#4b41e1] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#4b41e1]/90 transition-all">Get Started</Link>
            </nav>
          </header>
          
          <main className="flex-1">
            <Outlet context={{ user, setUser }} />
          </main>

          <footer className="relative bg-gradient-to-b from-[#0d1222] via-[#090c16] to-[#05060b] text-[#dae2fd] pt-16 pb-12 px-6 overflow-hidden">
            {/* Top Border Ambient Glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#4b41e1]/40 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-12 bg-[#4b41e1]/10 blur-xl rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#7c839b]/10">
                
                {/* Brand Section */}
                <div className="md:col-span-5 flex flex-col items-start gap-4">
                  <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white tracking-tight hover:opacity-90 transition-opacity">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4b41e1] to-[#645efb] flex items-center justify-center shadow-lg shadow-[#4b41e1]/20">
                      <span className="material-symbols-outlined text-white text-2xl">newspaper</span>
                    </div>
                    <div>
                      <span className="block leading-none">Civic Intelligence</span>
                      <span className="text-[10px] text-[#7c839b] font-medium tracking-wider uppercase mt-1">Information Integrity</span>
                    </div>
                  </Link>
                  <p className="text-[#7c839b] text-sm leading-relaxed max-w-sm mt-2">
                    Securing information integrity for governmental bodies and NGOs. Standardized bias scoring protocol compliant with Global Insight ISO-902.
                  </p>
                  
                  {/* Status Indicator */}
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System: Fully Operational
                  </div>
                </div>

                {/* Navigation Columns */}
                <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:justify-items-end">
                  
                  {/* System Portal Column */}
                  <div className="flex flex-col gap-4">
                    <h6 className="text-xs uppercase font-bold tracking-widest text-[#7c839b]">System</h6>
                    <ul className="flex flex-col gap-3 text-sm">
                      <li>
                        <Link to="/login" className="text-[#7c839b] hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60 group-hover:text-white transition-colors">login</span>
                          <span>Login Portal</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/register" className="text-[#7c839b] hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60 group-hover:text-white transition-colors">person_add</span>
                          <span>Register Officer</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Compliance Column */}
                  <div className="flex flex-col gap-4">
                    <h6 className="text-xs uppercase font-bold tracking-widest text-[#7c839b]">Compliance</h6>
                    <ul className="flex flex-col gap-3 text-sm">
                      <li>
                        <a href="#" className="text-[#7c839b] hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60 group-hover:text-white transition-colors">shield</span>
                          <span>Privacy Protocol</span>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="text-[#7c839b] hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60 group-hover:text-white transition-colors">gavel</span>
                          <span>Terms of Engagement</span>
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Contact / Verification Column */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
                    <h6 className="text-xs uppercase font-bold tracking-widest text-[#7c839b]">Support</h6>
                    <ul className="flex flex-col gap-3 text-sm">
                      <li>
                        <a href="mailto:support@civicintel.org" className="text-[#7c839b] hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60 group-hover:text-white transition-colors">mail</span>
                          <span>support@civicintel.org</span>
                        </a>
                      </li>
                      <li>
                        <span className="text-[#7c839b] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-[#7c839b]/60">verified</span>
                          <span className="text-xs uppercase font-semibold text-[#7c839b]/80">ISO 902 Certified</span>
                        </span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Bottom Copyright & Protocol Info */}
              <div className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#7c839b]">
                <div className="flex items-center gap-2">
                  <span>&copy; {new Date().getFullYear()} CIVIC INTELLIGENCE SOLUTIONS.</span>
                  <span className="hidden sm:inline text-[#7c839b]/40">|</span>
                  <span>ALL RIGHTS RESERVED.</span>
                </div>
                <div className="flex gap-6">
                  <a href="#" className="hover:text-white transition-colors duration-200">PRIVACY PROTOCOL</a>
                  <a href="#" className="hover:text-white transition-colors duration-200">TERMS OF ENGAGEMENT</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}


      {/* Floating Chatbot Widget */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
          {/* Chat Icon Button */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-12 h-12 bg-gradient-to-r from-[#4b41e1] to-[#3323cc] hover:from-[#3f34cc] hover:to-[#22179c] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative group"
            title="Search Intelligence Assistant"
          >
            <span className="material-symbols-outlined text-2xl">
              {isChatOpen ? 'close' : 'smart_toy'}
            </span>
            {!isChatOpen && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3323cc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e2dfff]"></span>
              </span>
            )}
          </button>

          {/* Chat Window Panel */}
          {isChatOpen && (
            <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[460px] bg-white dark:bg-[#121824]/95 border border-[#c6c6cd] dark:border-[#333d52] rounded-2xl shadow-2xl overflow-hidden flex flex-col glass-panel animate-in fade-in slide-in-from-bottom-4 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#4b41e1] to-[#3323cc] p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">Civic Intelligence Bot</h4>
                    <span className="text-[9px] text-[#e2dfff] font-semibold flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Online Assistant
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Message History List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fcf8fa]/40 dark:bg-[#0c101b]/20">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#4b41e1] text-white rounded-br-none shadow-sm'
                          : 'bg-[#f6f3f5] dark:bg-[#1c2436] text-[#1b1b1d] dark:text-[#f3f0f2] rounded-bl-none border border-[#c6c6cd]/40 dark:border-[#333d52]/40 shadow-sm'
                      }`}
                    >
                      {renderMessageText(msg.text, msg.sender === 'user')}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#f6f3f5] dark:bg-[#1c2436] border border-[#c6c6cd]/40 dark:border-[#333d52]/40 rounded-2xl rounded-bl-none p-3 text-xs text-[#76777d] dark:text-[#a0a5b5] shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer Form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-[#c6c6cd]/40 dark:border-[#333d52]/40 bg-[#f6f3f5] dark:bg-[#161c28] flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Query scraped news headline..."
                  className="flex-1 bg-white dark:bg-[#0c101b] border border-[#c6c6cd] dark:border-[#333d52] rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] dark:focus:border-[#7f78ff] outline-none transition-all"
                />
                <button 
                  type="submit"
                  className="bg-[#4b41e1] hover:bg-[#3f34cc] text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
