'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else {
        // Restore role-based landing page logic
        if (user.role === 'TECH') {
          router.replace('/my-jobs')
        } else {
          router.replace('/dashboard')
        }
      }
    }
  }, [user, loading, router])

  return (
    <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div className="spinner" />
    </div>
  )
}
