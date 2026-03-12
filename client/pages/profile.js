import {useContext,useState,useEffect} from 'react'
import {useRouter} from 'next/router'
import {AuthContext} from './_app'
import Header from '../components/Header'
import axios from 'axios'

export default function Profile(){
  const {token,user,setUser} = useContext(AuthContext)
  const router = useRouter()
  const [posts,setPosts]=useState([])
  const [newPost,setNewPost]=useState({image:null,caption:''})
  const [preview,setPreview]=useState(null)
  const [loading,setLoading]=useState(false)
  const [editing,setEditing]=useState(false)
  const [editForm,setEditForm]=useState({
    firstName:'',
    lastName:'',
    username:'',
    country:'',
    phone:''
  })
  const [editLoading,setEditLoading]=useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)

  useEffect(()=>{
    if(token) {
      fetchPosts()
      if(user) {
        setEditForm({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          username: user.username || '',
          country: user.country || '',
          phone: user.phone || ''
        })
        if(user.profile_photo) {
          setPhotoPreview(`http://localhost:3001/${user.profile_photo}`)
        }
      }
    }
  },[token, user])

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

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0]
    if(file) {
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = e => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const submitPost=async(e)=>{
    e.preventDefault()
    if(!newPost.image) return alert('Image required')
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
      alert('Post created successfully!')
    }catch(err){
      alert(err.response?.data?.error || 'Failed to post')
    }finally{setLoading(false)}
  }

  const handleEditSubmit = async(e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const formData = new FormData()
      formData.append('first_name', editForm.firstName)
      formData.append('last_name', editForm.lastName)
      formData.append('username', editForm.username)
      formData.append('country', editForm.country)
      formData.append('phone', editForm.phone)
      
      if(profilePhoto) {
        formData.append('profilePhoto', profilePhoto)
      }

      const res = await axios.put('http://localhost:3001/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setUser(res.data)
      setEditing(false)
      setProfilePhoto(null)
      alert('Profile updated successfully!')
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setEditLoading(false)
    }
  }

  if(!user) return <div>Loading...</div>

  return (
    <>
      <Header />
      <div className='profile-page'>
        {/* Profile Header Card */}
        <div className='profile-header-card'>
          <div className='profile-header-content'>
            <div className='profile-photo-container'>
              {photoPreview ? (
                <img src={photoPreview} alt={user.first_name} className='profile-photo' />
              ) : (
                <div className='profile-placeholder'>
                  {user.first_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className='profile-info-block'>
              <h1>{user.first_name} {user.last_name}</h1>
              <p className='profile-username'>@{user.username}</p>
              <p className='profile-location'>📍 {user.country || 'Not specified'}</p>
              <p className='profile-phone'>📱 {user.phone || 'Not specified'}</p>
              {user.vip && <span className='vip-badge-small'>⭐ VIP</span>}
            </div>
          </div>
          
          {!editing && (
            <button 
              className='btn-secondary' 
              onClick={() => setEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <div className='edit-profile-section'>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit} className='edit-form'>
              <div className='form-row'>
                <div className='form-group'>
                  <label>First Name</label>
                  <input
                    type='text'
                    value={editForm.firstName}
                    onChange={e => setEditForm(prev => ({...prev, firstName: e.target.value}))}
                    placeholder='First name'
                  />
                </div>
                <div className='form-group'>
                  <label>Last Name</label>
                  <input
                    type='text'
                    value={editForm.lastName}
                    onChange={e => setEditForm(prev => ({...prev, lastName: e.target.value}))}
                    placeholder='Last name'
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label>Username</label>
                  <input
                    type='text'
                    value={editForm.username}
                    onChange={e => setEditForm(prev => ({...prev, username: e.target.value}))}
                    placeholder='Username'
                  />
                </div>
                <div className='form-group'>
                  <label>Country</label>
                  <input
                    type='text'
                    value={editForm.country}
                    onChange={e => setEditForm(prev => ({...prev, country: e.target.value}))}
                    placeholder='Country'
                  />
                </div>
              </div>

              <div className='form-group'>
                <label>Phone</label>
                <input
                  type='tel'
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({...prev, phone: e.target.value}))}
                  placeholder='Phone number'
                />
              </div>

              <div className='form-group'>
                <label>Profile Photo</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleProfilePhotoChange}
                />
                {photoPreview && (
                  <div className='photo-preview-edit'>
                    <img src={photoPreview} alt='preview' />
                  </div>
                )}
              </div>

              <div className='form-actions'>
                <button type='submit' className='btn btn-primary' disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type='button' 
                  className='btn btn-secondary' 
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Section */}
        <div className='post-section'>
          <div className='section-header'>
            <h2>📸 Your Pictures ({posts.length})</h2>
            {!user.vip && <span className='posts-limit'>Non-VIP: {posts.length}/2</span>}
          </div>
          
          <div className='posts-grid'>
            {posts.map(p=>(
              <div key={p.id} className='post-card'>
                <img 
                  src={p.image.startsWith('http')?p.image:`http://localhost:3001/${p.image}`} 
                  alt='user post' 
                />
                {p.caption && <p className='post-caption'>{p.caption}</p>}
              </div>
            ))}
            {posts.length===0 && (
              <div className='empty-posts'>
                <p>📭 No posts yet. Share your first photo!</p>
              </div>
            )}
          </div>

          {/* Post Form */}
          <form className='post-form' onSubmit={submitPost}>
            <h3>Share a New Photo</h3>
            <div className='form-group'>
              <label>Caption (optional)</label>
              <input
                type='text'
                value={newPost.caption}
                onChange={e=>setNewPost(prev=>({...prev,caption:e.target.value}))}
                placeholder='Write something about this photo... ✍️'
              />
            </div>
            <div className='form-group'>
              <label>Select Image *</label>
              <input
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                required
              />
              {preview && (
                <div className='preview-container'>
                  <img src={preview} className='preview-img' alt='preview' />
                </div>
              )}
            </div>
            <button type='submit' disabled={loading} className='btn btn-primary'>
              {loading ? '⏳ Uploading...' : '📤 Post Photo'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}