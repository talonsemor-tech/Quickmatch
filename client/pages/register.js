import {useState, useEffect} from 'react'
import {useRouter} from 'next/router'
import axios from 'axios'

export default function Register(){
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    country: '',
    phone: '',
    profilePhoto: null
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [existingProfile, setExistingProfile] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      fetchExistingProfile(token)
    }
  }, [])

  const fetchExistingProfile = async (token) => {
    try {
      const res = await axios.get('http://localhost:3001/profile', {
        headers: {Authorization: `Bearer ${token}`}
      })
      setExistingProfile(res.data)
      // Pre-fill form with existing data
      setFormData({
        email: res.data.email || '',
        password: '', // Don't pre-fill password
        firstName: res.data.first_name || '',
        lastName: res.data.last_name || '',
        username: res.data.username || '',
        country: res.data.country || '',
        phone: res.data.phone || '',
        profilePhoto: null
      })
      if (res.data.profile_photo) {
        setPreview(`http://localhost:3001/${res.data.profile_photo}`)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleInputChange = (e) => {
    const {name, value} = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if(file){
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }))
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!formData.profilePhoto && !existingProfile?.profile_photo){
      alert('Profile photo is required')
      return
    }

    setLoading(true)
    try{
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key])
        }
      })

      if (isLoggedIn) {
        // Update existing profile
        await axios.put('http://localhost:3001/profile', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        alert('Profile updated successfully!')
      } else {
        // New registration
        await axios.post('http://localhost:3001/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        alert('Registration successful! Please login.')
      }

      router.push('/')
    }catch(error){
      alert(`Operation failed: ${error.response?.data?.error || 'Unknown error'}`)
    }finally{
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Placeholder for Google OAuth
    alert('Google login will be implemented soon!')
  }

  const handleGithubLogin = () => {
    // Placeholder for GitHub OAuth
    alert('GitHub login will be implemented soon!')
  }

  return (
    <div className='register-container'>
      <div className='register-card'>
        <div className='register-header'>
          <h1>Join QuickMatch</h1>
          <p>Find your perfect partner today</p>
        </div>

        <div className='google-login'>
          <button className='btn-google' onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>          <button className='btn-google' onClick={handleGithubLogin} style={{marginTop:'0.5rem'}}>
            <i className="fab fa-github"></i> Continue with GitHub
          </button>        </div>

        <div className='divider'>
          <span>or</span>
        </div>

        <form className='register-form' onSubmit={handleSubmit}>
          <div className='form-row'>
            <div className='form-group'>
              <label>First Name *</label>
              <input
                type='text'
                name='firstName'
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder='Enter your first name'
              />
            </div>
            <div className='form-group'>
              <label>Last Name *</label>
              <input
                type='text'
                name='lastName'
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder='Enter your last name'
              />
            </div>
          </div>

          <div className='form-group'>
            <label>Username *</label>
            <input
              type='text'
              name='username'
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder='Choose a unique username'
            />
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label>Country *</label>
              <select
                name='country'
                value={formData.country}
                onChange={handleInputChange}
                required
              >
                <option value=''>Select Country</option>
                <option value='US'>United States</option>
                <option value='CA'>Canada</option>
                <option value='UK'>United Kingdom</option>
                <option value='AU'>Australia</option>
                <option value='DE'>Germany</option>
                <option value='FR'>France</option>
                <option value='IT'>Italy</option>
                <option value='ES'>Spain</option>
                <option value='NL'>Netherlands</option>
                <option value='BR'>Brazil</option>
                <option value='MX'>Mexico</option>
                <option value='IN'>India</option>
                <option value='CN'>China</option>
                <option value='JP'>Japan</option>
                <option value='KR'>South Korea</option>
                <option value='SG'>Singapore</option>
                <option value='AE'>UAE</option>
                <option value='ZA'>South Africa</option>
              </select>
            </div>
            <div className='form-group'>
              <label>Phone Number *</label>
              <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder='+1 (555) 123-4567'
              />
            </div>
          </div>

          <div className='form-group'>
            <label>Email *</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='your@email.com'
            />
          </div>

          <div className='form-group'>
            <label>Password *</label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder='Create a strong password'
            />
          </div>

          <div className='form-group'>
            <label>Profile Photo * (Required)</label>
            <div className='photo-upload'>
              <input
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                required
                id='profilePhoto'
                style={{display: 'none'}}
              />
              <label htmlFor='profilePhoto' className='photo-upload-btn'>
                {preview ? (
                  <img src={preview} alt='Preview' className='photo-preview' />
                ) : (
                  <div className='photo-placeholder'>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1.586a1 1 0 0 1 .707.293l.707.707A1 1 0 0 0 12.414 11H13a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1a4 4 0 0 1 4-4z"/>
                      <circle cx="9" cy="9" r="2"/>
                    </svg>
                    <span>Click to upload photo</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button type='submit' className='btn-register' disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className='login-link'>
          <p>Already have an account? <a href='/'>Login here</a></p>
        </div>
      </div>
    </div>
  )
}