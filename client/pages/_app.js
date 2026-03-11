import '../styles/style.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {createContext,useState,useEffect} from 'react'
import {useRouter} from 'next/router'
import axios from 'axios'

export const AuthContext = createContext()

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [token,setToken] = useState(null)
  const [user,setUser] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if(t) setToken(t)
  },[])

  useEffect(() => {
    if(token){
      axios.get('http://localhost:3001/profile',{headers:{Authorization:`Bearer ${token}`}})
        .then(res=>setUser(res.data))
        .catch(err=>{
          console.error('profile fetch',err)
          localStorage.removeItem('token')
          setToken(null)
          router.push('/')
        })
    } else {
      setUser(null)
    }
  },[token])

  useEffect(() => {
    const publicPaths=['/','/register','/about','/vip']
    if(!token && !publicPaths.includes(router.pathname)){
      router.push('/')
    }
    if(token && user && !user.first_name && router.pathname !== '/register'){
      router.push('/register')
    }
  },[router.pathname, token, user])

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{token,user,setToken,setUser,logout}}>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </AuthContext.Provider>
  )
}