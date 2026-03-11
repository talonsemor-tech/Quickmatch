import {useState} from 'react'
import Link from 'next/link'

export default function VIP(){

const [paid,setPaid]=useState(false)

function handlePayment(){
 // Simulate payment
 setPaid(true)
 alert('Payment successful! You are now VIP.')
}

return (
<div className='vip-container'>
<div className='vip-card'>
<h1>VIP Membership</h1>
<p>Hide your identity and get premium features</p>
{!paid ? (
<div>
<h3>$9.99/month</h3>
<p>Anonymous browsing, priority matches, unlimited swipes</p>
<button className='btn btn-primary' onClick={handlePayment}>Pay Now</button>
</div>
) : (
<div>
<h3>Welcome VIP!</h3>
<p>Your identity is now hidden. Enjoy premium features.</p>
<Link href='/discover' className='btn btn-secondary'>Start Browsing</Link>
</div>
)}
</div>
</div>
)
}