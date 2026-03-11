import {useContext,useState,useEffect} from 'react'
import {AuthContext} from './_app'
import axios from 'axios'

export default function Profile(){
  const {token,user} = useContext(AuthContext)
  const [posts,setPosts]=useState([])
  const [newPost,setNewPost]=useState({image:null,caption:''})
  const [preview,setPreview]=useState(null)
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    if(token) fetchPosts()
  },[token])

  const fetchPosts=async()=>{
    try{
      const res=await axios.get('http://localhost:3001/posts/me',{
        headers:{Authorization:`Bearer ${token}`}
      })
      setPosts(res.data)
    }catch(e){ console.error('fetch posts',e)}
  }

  const handleFileChange=e=>{
    const file=e.target.files[0]
    setNewPost(prev=>({...prev,image:file}))
    const reader=new FileReader()
    reader.onload=e=>setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const submitPost=async(e)=>{
    e.preventDefault()
    if(!newPost.image) return alert('Image required')
    // simple client-side limit check
    if(!user.vip && posts.length>=2){
      return alert('Non-VIP users can only upload 2 pictures. Upgrade to VIP for more.')
    }
    setLoading(true)
    try{
      const form=new FormData()
      form.append('image',newPost.image)
      form.append('caption',newPost.caption)
      await axios.post('http://localhost:3001/posts',form,{
        headers:{
          Authorization:`Bearer ${token}`,
          'Content-Type':'multipart/form-data'
        }
      })
      setNewPost({image:null,caption:''})
      setPreview(null)
      fetchPosts()
    }catch(err){
      alert(err.response?.data?.error || 'Failed to post')
    }finally{setLoading(false)}
  }

  if(!user) return <div>Loading...</div>

  return (
    <div className='profile-page'>
      <h1>Welcome, {user.first_name} {user.last_name}</h1>
      <div className='post-section'>
        <h2>Your Pictures</h2>
        <div className='posts-grid'>
          {posts.map(p=>(
            <div key={p.id} className='post-card'>
              <img src={p.image.startsWith('http')?p.image:`http://localhost:3001/${p.image}`} alt='user post' />
              {p.caption && <p className='post-caption'>{p.caption}</p>}
            </div>
          ))}
          {posts.length===0 && <p>No posts yet.</p>}
        </div>

        <form className='post-form' onSubmit={submitPost}>
          <div className='form-group'>
            <label>Caption (optional)</label>
            <input
              type='text'
              value={newPost.caption}
              onChange={e=>setNewPost(prev=>({...prev,caption:e.target.value}))}
              placeholder='Write something about this photo'
            />
          </div>
          <div className='form-group'>
            <label>Image *</label>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              required
            />
            {preview && <img src={preview} className='preview-img' />}
          </div>
          <button type='submit' disabled={loading} className='btn btn-primary'>
            {loading ? 'Uploading...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  )
}