import {useState,useEffect,useContext} from 'react'
import Link from 'next/link'
import axios from 'axios'
import { AuthContext } from './_app'

export default function Home(){

const {token,user,setToken,setUser} = useContext(AuthContext)
const [email,setEmail]=useState('')
const [password,setPassword]=useState('')
const [loading,setLoading]=useState(false)

const isProfileComplete = () => {
  return user && user.first_name && user.last_name && 
         user.username && user.country && user.phone && 
         user.profile_photo
}

async function login(){
 try{
  setLoading(true)
  const res=await axios.post('http://localhost:3001/login',{email,password})
  localStorage.setItem('token',res.data.token)
  setToken(res.data.token)
  // context will fetch profile automatically via _app
 }catch(e){
  alert('Login failed')
 }finally{
  setLoading(false)
 }
}

async function register(){
 try{
  setLoading(true)
  await axios.post('http://localhost:3001/register',{email,password})
  alert('Account created! Now login.')
 }catch(e){
  alert('Registration failed')
 }finally{
  setLoading(false)
 }
}

return (

<div className='hero'>

<div className='hero-content'>

<h1>QuickMatch</h1>
<p className='tagline'>Find Your Perfect Match Today</p>

{!token && (
<div className='auth-container'>
<form className='auth-form' onSubmit={e=>e.preventDefault()}>
<div className='form-group'>
<label>Email</label>
<input
  type='email'
  placeholder='your@email.com'
  value={email}
  onChange={e=>setEmail(e.target.value)}
  required
/>
</div>
<div className='form-group'>
<label>Password</label>
<input
  type='password'
  placeholder='••••••••'
  value={password}
  onChange={e=>setPassword(e.target.value)}
  required
/>
</div>
<div className='button-group'>
<button className='btn btn-primary' onClick={login} disabled={loading}>
{loading ? 'Loading...' : 'Login'}
</button>
<button className='btn btn-secondary' onClick={register} disabled={loading}>
{loading ? 'Loading...' : 'Register'}
</button>
</div>
</form>
</div>
)}

{token && (
<div className='button-group'>
  {isProfileComplete() ? (
    <>
      <Link href='/discover' className='btn btn-primary'>Start Swiping</Link>
      <Link href='/chat' className='btn btn-secondary'>Chat Now</Link>
      <Link href='/vip' className='btn btn-outline'>Go VIP</Link>
    </>
  ) : (
    <>
      <Link href='/register' className='btn btn-primary'>Complete Registration</Link>
      <Link href='/chat' className='btn btn-secondary'>Chat Now</Link>
      <Link href='/vip' className='btn btn-outline'>Go VIP</Link>
    </>
  )}
</div>
)}

</div>

</div>

)

}
