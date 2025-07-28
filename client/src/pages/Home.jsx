import React from 'react'
import Categories from '../components/Categories'
import StudentsFavorites from '../components/StudentsFavorites'

function Home() {
  return (
    <div className='mt-10'>
        <Categories />
        <StudentsFavorites />
    </div>
  )
}

export default Home