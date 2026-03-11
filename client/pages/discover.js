import axios from 'axios'
import {useState, useEffect, useContext} from 'react'
import { AuthContext } from './_app'

export default function Discover(){

const [profiles,setProfiles]=useState([
  {id:1,name:'Sarah',age:24,location:'New York',image:'https://via.placeholder.com/300x400/ff6b6b/ffffff?text=Sarah', bio:'Looking for someone fun and genuine. Love travel, food, and good conversations!'},
  {id:2,name:'Jessica',age:23,location:'NYC',image:'https://via.placeholder.com/300x400/4ecdc4/ffffff?text=Jessica', bio:'Adventurous soul seeking meaningful connections. Coffee enthusiast and weekend hiker.'},
  {id:3,name:'Mike',age:26,location:'Brooklyn',image:'https://via.placeholder.com/300x400/667eea/ffffff?text=Mike', bio:'Tech guy by day, musician by night. Let\'s create some memories together.'},
  {id:4,name:'Emma',age:22,location:'Queens',image:'https://via.placeholder.com/300x400/f093fb/ffffff?text=Emma', bio:'Art lover and bookworm. Seeking someone to explore museums and hidden gems with.'},
  {id:5,name:'Alex',age:25,location:'Manhattan',image:'https://via.placeholder.com/300x400/f5576c/ffffff?text=Alex', bio:'Fitness enthusiast and foodie. Looking for a partner in crime for healthy adventures.'},
])
const [current,setCurrent]=useState(0)
const [userProfile, setUserProfile] = useState(null)

useEffect(() => {
  fetchUserProfile()
}, [])

const fetchUserProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await axios.get('http://localhost:3001/profile', {
      headers: {Authorization: `Bearer ${token}`}
    })
    setUserProfile(res.data)
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
  }
}

async function swipe(liked){

 const token=localStorage.getItem('token')

 if(!token) return alert('Login first')

 if(liked){
  await axios.post('http://localhost:3001/swipe',{
  target:profiles[current].id
  },{
   headers:{Authorization:`Bearer ${token}`}
  })
 }
 
 if(current < profiles.length-1){
  setCurrent(current+1)
 }else{
  alert('No more profiles!')
  setCurrent(0)
 }

}

return (

<div className='discover-container'>

{userProfile && (
  <div className='user-profile-bar'>
    <div className='user-avatar'>
      <img src={userProfile.profile_photo ? `http://localhost:3001/${userProfile.profile_photo}` : 'https://via.placeholder.com/40x40/cccccc/ffffff?text=U'} alt='Your profile' />
    </div>
    <div className='user-info'>
      <span className='user-name'>{userProfile.first_name} {userProfile.last_name}</span>
      <span className='user-username'>@{userProfile.username}</span>
    </div>
  </div>
)}

<div className='profile-card'>

<div className='profile-image'>
<img src={profiles[current]?.image} alt={profiles[current]?.name} />
</div>

<div className='profile-info'>

<h2 className='profile-name'>{profiles[current]?.name}, {profiles[current]?.age}</h2>

<div className='profile-details'>
<span className='profile-detail'>📍 {profiles[current]?.location}</span>
</div>

<p className='profile-bio'>{profiles[current]?.bio}</p>

<div className='swipe-buttons'>
<button className='swipe-btn pass' onClick={()=>swipe(false)}>✕</button>
<button className='swipe-btn like' onClick={()=>swipe(true)}>♥</button>
</div>

</div>

</div>

</div>

)

}
