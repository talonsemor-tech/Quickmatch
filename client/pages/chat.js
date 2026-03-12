
import { useEffect, useState, useContext, useRef } from "react"
import io from "socket.io-client"
import axios from 'axios'
import { AuthContext } from './_app'
import Header from '../components/Header'

export default function Chat(){
  const { token, user } = useContext(AuthContext)
  const [socket, setSocket] = useState(null)
  const [msg, setMsg] = useState("")
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const emojis = ['😀', '😂', '❤️', '😍', '🎉', '🔥', '👍', '😎', '🤔', '😘', '✨', '💯', '😱', '🙌', '😂', '💕', '🌟', '😜']

  useEffect(() => {
    if (!user) return
    const s = io("http://localhost:4000", { auth: { token } })

    s.on("connect", () => {
      s.emit("join", user.id)
    })

    s.on("receive_message", (data) => {
      setMessages(m => [...m, {
        ...data,
        own: false,
        timestamp: new Date().toLocaleTimeString()
      }])
    })

    setSocket(s)

    // Fetch all users for user list
    axios.get('http://localhost:3001/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUsers(res.data.filter(u => u.id !== user.id))
    }).catch(e => console.error('fetch users', e))

    // Fetch previous messages
    axios.get('http://localhost:3001/messages', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setMessages(res.data.map(m => ({
        text: m.content,
        image: m.image,
        own: m.sender === user.id,
        to: m.receiver,
        from: m.sender,
        senderName: m.sender_name,
        timestamp: new Date(m.created_at).toLocaleTimeString()
      })))
    }).catch(e => console.error('load msgs', e))

    return () => {
      s.disconnect()
    }
  }, [user, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const sendPhoto = async () => {
    if (!photoFile || !selectedUser) return alert('Select a photo and recipient')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('to', selectedUser.id)
      formData.append('caption', msg)

      await axios.post('http://localhost:3001/messages/photo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessages(m => [...m, {
        text: msg,
        image: photoPreview,
        own: true,
        to: selectedUser.id,
        timestamp: new Date().toLocaleTimeString()
      }])

      setPhotoFile(null)
      setPhotoPreview(null)
      setMsg("")
      setShowPhotoUpload(false)
      socket.emit("send_message", {
        to: selectedUser.id,
        text: msg,
        image: photoPreview,
        from: user?.id
      })
    } catch (e) {
      console.error('send photo error', e)
      alert('Failed to send photo')
    } finally {
      setLoading(false)
    }
  }

  const addEmoji = (emoji) => {
    setMsg(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const send = () => {
    if (!msg.trim() && !photoFile) return
    if (!selectedUser) return alert('Select a recipient')

    socket.emit("send_message", {
      to: selectedUser.id,
      text: msg,
      from: user?.id
    })

    setMessages(m => [...m, {
      text: msg,
      own: true,
      to: selectedUser.id,
      timestamp: new Date().toLocaleTimeString()
    }])

    setMsg("")
  }

  const filteredMessages = selectedUser
    ? messages.filter(m => (m.to === selectedUser.id && m.own) || (m.from === selectedUser.id && !m.own))
    : messages

  return (
    <>
      <Header />
      <div className='chat-page-container'>
        <div className='chat-sidebar'>
          <div className='sidebar-header'>
            <h3>💬 Chats</h3>
            <span className='user-count'>{users.length}</span>
          </div>
          <div className='users-list'>
            {users.map(u => (
              <div
                key={u.id}
                className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className='user-avatar'>{u.first_name?.charAt(0).toUpperCase()}</div>
                <div className='user-info'>
                  <div className='user-name'>{u.first_name} {u.last_name}</div>
                  <div className='user-status'>Online</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='chat-main'>
          {selectedUser ? (
            <>
              <div className='chat-header-main'>
                <div className='header-info'>
                  <h2>{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <span className='online-badge'>● Online</span>
                </div>
              </div>

              <div className='chat-messages-container'>
                {filteredMessages.map((m, i) => (
                  <div key={i} className={`message-group ${m.own ? 'own' : 'other'}`}>
                    {m.image && (
                      <div className='message-image'>
                        <img src={m.image} alt="shared" />
                      </div>
                    )}
                    {m.text && (
                      <div className='message-bubble'>{m.text}</div>
                    )}
                    <span className='message-time'>{m.timestamp}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className='chat-input-section'>
                {photoPreview && (
                  <div className='photo-preview-section'>
                    <div className='photo-preview'>
                      <img src={photoPreview} alt="preview" />
                      <button onClick={() => { setPhotoPreview(null); setPhotoFile(null) }} className='remove-photo'>✕</button>
                    </div>
                  </div>
                )}

                {showEmojiPicker && (
                  <div className='emoji-picker'>
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        className='emoji-btn'
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className='chat-input-controls'>
                  <input
                    type='text'
                    className='chat-input'
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && send()}
                    placeholder='Type a message...'
                  />

                  <button
                    className='chat-action-btn emoji-btn-toggle'
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title='Add emoji'
                  >
                    😊
                  </button>

                  <button
                    className='chat-action-btn photo-btn-toggle'
                    onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                    title='Share photo'
                  >
                    🖼️
                  </button>

                  <button
                    className='chat-send-btn'
                    onClick={photoFile ? sendPhoto : send}
                    disabled={loading}
                  >
                    {loading ? '⏳' : '📤'}
                  </button>
                </div>

                {showPhotoUpload && (
                  <div className='photo-upload-section'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handlePhotoChange}
                      className='photo-input'
                    />
                    {photoFile && (
                      <button className='btn-primary' onClick={sendPhoto} disabled={loading}>
                        {loading ? 'Sending...' : 'Send Photo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className='no-chat-selected'>
              <div className='empty-state'>
                <span className='empty-icon'>💬</span>
                <h2>Select a chat to start messaging</h2>
                <p>Choose a user from the list to begin your conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
