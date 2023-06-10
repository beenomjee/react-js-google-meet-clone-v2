import { Route, Routes } from 'react-router-dom'
import { ErrorPage, Home, Room, SignIn, SignUp } from './modules'
import { ProtectedRoute } from './components'
import { SocketProvider } from './context'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<ProtectedRoute element={<Home />} />} />
        <Route path='/room/:roomId' element={<ProtectedRoute element={<SocketProvider><Room /></SocketProvider>} />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/signin' element={<SignIn />} />
        <Route path='*' element={<ErrorPage />} />
      </Routes>
    </div>
  )
}

export default App