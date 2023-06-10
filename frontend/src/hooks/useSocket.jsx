import { useContext } from 'react'
import { SocketContext } from '../context'

const useSocket = () => {
    return useContext(SocketContext)
}

export default useSocket