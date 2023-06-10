import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getLocalStream } from '../utils';
import { toast } from 'react-toastify';
import { Loader } from '../components';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Peer from 'peerjs-client';
import { useSelector } from 'react-redux';

export const SocketContext = React.createContext({
    socketRef: null,
    localStreamRef: null,
    peerRef: null,
    connectedUserRef: null,
    screenStreamRef: null,
});

const regexExp = /^[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}$/;

const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerRef = useRef(null);
    const connectedUserRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const isJoin = useRef(Boolean(new URLSearchParams(location.search).get('isjoin')));
    const { roomId } = useParams();
    const user = useSelector(store => store.user)
    const screenStreamRef = useRef(null);


    useEffect(() => {
        const connectPeerServer = () => {
            console.log('Connecting to peer...');
            const peer = new Peer({
                host: import.meta.env.VITE_PEER_BACKEND_URL,
                port: import.meta.env.VITE_PEER_BACKEND_URL_PORT,
                path: '/peerjs'
            });
            peer.on('open', (peerId) => {
                peerRef.current = peer;
                const userInfo = {
                    name: user.name,
                    email: user.email,
                    img: user.file,
                    peerId,
                    socketId: socketRef.current.id,
                    isVideoOn: true,
                    isMicOn: true,
                    isScreenSharing: false,
                }
                socketRef.current.emit('roomData:request', { roomId, userInfo });
                socketRef.current.on('roomData:fulfilled', ({ connectedUsers }) => {
                    connectedUserRef.current = connectedUsers;
                    setIsLoading(false);
                });
                socketRef.current.on('roomData:rejected', () => {
                    navigate('/', { replace: true });
                    toast.error('Something went wrong. Please try again!');
                });
            });
        }

        const getStream = async () => {
            console.log('Getting Stream...');
            try {
                localStreamRef.current = await getLocalStream()
                connectPeerServer();
            } catch (err) {
                toast.error("These permissions are required!");
                navigate('/', { replace: true })
            }
        }

        if (!regexExp.test(roomId)) {
            toast.error("Room not found!");
            navigate('/', { replace: true })
            return;
        }

        console.log('Connecting ws...');
        const socket = io(import.meta.env.VITE_BACKEND_URL);
        socket.on('connect', () => {
            if (isJoin.current) {
                socket.emit('isRoomExist:request', { roomId });
                socket.on('isRoomExist:fullfilled', () => {
                    toast.success("Room joined!");
                    getStream();
                });
                socket.on('isRoomExist:rejected', () => {
                    toast.error('Room not found!');
                    navigate('/', { replace: true });
                });
            } else {
                socket.emit('createRoom:request', { roomId });
                socket.on('createRoom:fullfilled', () => {
                    toast.success('creating room!');
                    window.history.replaceState(null, null, '?isjoin=true');
                    getStream();
                });
                socket.on('createRoom:rejected', () => {
                    toast.error('Room already exist!');
                    navigate('/', { replace: true });
                });
            }
        })

        socketRef.current = socket;

        return () => {
            console.log('Disconnecting ws...');
            socket.close();
            if (!localStreamRef.current) return;
            console.log('Stopping local stream tracks...');
            for (const track of localStreamRef.current.getTracks()) {
                track.stop();
            }
            if (!peerRef.current) return;
            console.log('disconnecting to peer...');
            peerRef.current.destroy();
        }
    }, [navigate, roomId, user])

    return (
        <SocketContext.Provider value={{ screenStreamRef, socketRef, localStreamRef, peerRef, connectedUserRef }}>
            {
                isLoading ? (
                    <div className="loader">
                        <Loader />
                    </div>
                ) : (
                    children
                )
            }
        </SocketContext.Provider>
    )
}

export default SocketProvider