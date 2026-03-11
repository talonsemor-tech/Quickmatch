import {useState,useEffect,useContext} from 'react'
import Link from 'next/link'
import { AuthContext } from '../pages/_app'

export default function Header(){

const [menuOpen,setMenuOpen]=useState(false)
const [theme,setTheme]=useState('dark')
const {token,user,logout} = useContext(AuthContext)

useEffect(()=>{
  const savedTheme=localStorage.getItem('theme') || 'dark'
  setTheme(savedTheme)
  document.body.className=savedTheme
},[])

function toggleTheme(){
  const newTheme=theme==='dark'?'light':'dark'
  setTheme(newTheme)
  localStorage.setItem('theme',newTheme)
  document.body.className=newTheme
}

return (
<header>
<nav>
<div className='logo'>QuickMatch{user ? ` - ${user.first_name}` : ''}</div>
<div className='nav-right'>
<button className='theme-toggle' onClick={toggleTheme}>🌙</button>
<button className='menu-btn' onClick={()=>setMenuOpen(!menuOpen)}>☰</button>
</div>
{menuOpen && (
<div className='menu'>
<Link href='/'>Home</Link>
{token && <Link href='/profile'>Profile</Link>}
<Link href='/discover'>Discover</Link>
<Link href='/chat'>Chat</Link>
<Link href='/vip'>VIP</Link>
<Link href='/about'>About</Link>
{token ? (
  <button onClick={logout} className='logout-btn'>Logout</button>
) : (
  <Link href='/'>Login</Link>
)}
</div>
)}
</nav>
</header>
)
}