import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { AuthContext } from './_app'
import Header from '../components/Header'

export default function Dashboard() {
  const { token, user, logout } = useContext(AuthContext)
  const router = useRouter()
  const [stats, setStats] = useState({ matches: 0, messages: 0, likes: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats(res.data)

        const activityRes = await axios.get('http://localhost:3001/dashboard/activity', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRecentActivity(activityRes.data)
      } catch (e) {
        console.error('fetch stats error', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token, user, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      <Header />
      <div className='dashboard-container'>
        {/* Welcome Banner */}
        <div className='welcome-banner'>
          <div className='welcome-content'>
            <h1>Welcome back, {user?.first_name}! 👋</h1>
            <p>Your quick match connection awaits</p>
          </div>
          <button className='logout-btn' onClick={handleLogout}>Logout</button>
        </div>

        {/* Profile Quick View Card */}
        <div className='profile-quick-card'>
          <div className='profile-avatar-large'>
            {user?.profile_photo ? (
              <img src={`http://localhost:3001/${user.profile_photo}`} alt={user.first_name} />
            ) : (
              <div className='avatar-placeholder'>
                {user?.first_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className='profile-quick-info'>
            <h2>{user?.first_name} {user?.last_name}</h2>
            <p className='username'>@{user?.username}</p>
            <p className='location'>📍 {user?.country || 'Not specified'}</p>
            <p className='phone'>📱 {user?.phone || 'Not specified'}</p>
            <button
              className='btn-secondary'
              onClick={() => router.push('/profile')}
            >
              Edit Profile
            </button>
          </div>
          {user?.vip && <div className='vip-badge'>⭐ VIP Member</div>}
        </div>

        {/* Stats Section */}
        <div className='stats-section'>
          <h2>Your Activity</h2>
          <div className='stats-grid'>
            <div className='stat-card'>
              <span className='stat-icon'>❤️</span>
              <h3>{stats.likes}</h3>
              <p>Likes Received</p>
            </div>
            <div className='stat-card'>
              <span className='stat-icon'>💬</span>
              <h3>{stats.messages}</h3>
              <p>Messages</p>
            </div>
            <div className='stat-card'>
              <span className='stat-icon'>👥</span>
              <h3>{stats.matches}</h3>
              <p>Matches</p>
            </div>
            <div className='stat-card'>
              <span className='stat-icon'>📸</span>
              <h3>{user?.post_count || 0}</h3>
              <p>Posts</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className='quick-nav-section'>
          <h2>Quick Access</h2>
          <div className='nav-buttons-grid'>
            <button
              className='nav-btn'
              onClick={() => router.push('/discover')}
            >
              <span className='nav-icon'>🔥</span>
              <span>Discover</span>
            </button>
            <button
              className='nav-btn'
              onClick={() => router.push('/chat')}
            >
              <span className='nav-icon'>💬</span>
              <span>Chat</span>
            </button>
            <button
              className='nav-btn'
              onClick={() => router.push('/profile')}
            >
              <span className='nav-icon'>📸</span>
              <span>My Posts</span>
            </button>
            <button
              className='nav-btn'
              onClick={() => router.push('/vip')}
            >
              <span className='nav-icon'>⭐</span>
              <span>VIP</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className='activity-feed-section'>
          <h2>Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className='activity-list'>
              {recentActivity.map((activity, idx) => (
                <div key={idx} className='activity-item'>
                  <span className='activity-icon'>{activity.icon}</span>
                  <div className='activity-content'>
                    <p className='activity-text'>{activity.text}</p>
                    <span className='activity-time'>{activity.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='no-activity'>
              <p>No recent activity yet. Start exploring! 🚀</p>
            </div>
          )}
        </div>

        {/* Membership Info */}
        <div className='membership-section'>
          <h2>Membership</h2>
          <div className='membership-card'>
            <div className='membership-status'>
              <h3>{user?.vip ? '⭐ VIP Member' : '🎯 Free Member'}</h3>
              <p>{user?.vip ? 'You have access to all premium features' : 'Upgrade to VIP to unlock premium features'}</p>
            </div>
            {!user?.vip && (
              <button
                className='btn-primary'
                onClick={() => router.push('/vip')}
              >
                Upgrade to VIP
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
