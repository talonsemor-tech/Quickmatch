
import {useEffect,useState,useContext} from "react"
import io from "socket.io-client"
import axios from 'axios'
import { AuthContext } from './_app'

export default function Chat(){

const {token,user} = useContext(AuthContext)
const [socket,setSocket]=useState(null)
const [msg,setMsg]=useState("")
const [messages,setMessages]=useState([])
const [recipient,setRecipient]=useState('')

useEffect(()=>{
  if(!user) return
  const s=io("http://localhost:4000",{
    auth:{token}
  })

  s.on("connect",()=>{
    s.emit("join",user.id)
  })

  s.on("receive_message",(data)=>{
    setMessages(m=>[...m,data])
  })

  setSocket(s)

  // fetch previous messages
  axios.get('http://localhost:3001/messages',{
    headers:{Authorization:`Bearer ${token}`}
  }).then(res=>{
    setMessages(res.data.map(m=>({
      text:m.content,
      own:m.sender===user.id,
      to:m.receiver
    })))
  }).catch(e=>console.error('load msgs',e))

  return ()=>{
    s.disconnect()
  }
},[user,token])

function send(){
 if(!msg.trim()) return
 const to = recipient || 'global'
 socket.emit("send_message",{to,text:msg,from:user?.id})
 setMessages(m=>[...m,{text:msg,own:true,to}])
 setMsg("")
}

return (
<div className='chat-container'>
<div className='chat-box'>
<div className='chat-header'>
<h2>Quick Chat</h2>
</div>
{user && (
  <div className='chat-recipient'>
    <input
      type='text'
      placeholder='Recipient user ID (leave blank for global)'
      value={recipient}
      onChange={e=>setRecipient(e.target.value)}
    />
  </div>
)}
<div className='chat-messages'>
{messages.map((m,i)=>(
<div key={i} className={`message ${m.own?'own':'other'}`}>
<div className='message-bubble'>{m.text || m}</div>
</div>
))}
</div>
<div className='chat-input-area'>
<input
  className='chat-input'
  value={msg}
  onChange={e=>setMsg(e.target.value)}
  onKeyPress={e=>e.key==='Enter'&&send()}
  placeholder='Type a message...'
/>
<button className='chat-send' onClick={send}>📤</button>
</div>
</div>
</div>
)

}
