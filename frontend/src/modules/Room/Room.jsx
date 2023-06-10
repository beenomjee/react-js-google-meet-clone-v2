import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Room.module.scss';
import { BsCameraVideoFill, BsCameraVideoOffFill, BsFillMicFill, BsFillMicMuteFill } from 'react-icons/bs'
import { MdCallEnd, MdPushPin, MdOutlineClose, MdOutlineScreenShare, MdChat, MdOutlineStopScreenShare, MdSend, MdSearch } from 'react-icons/md'
import { FaUser } from 'react-icons/fa'
import { useClickOutsideExtra, useSocket, useStateWithCallback } from '../../hooks';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { formatAMPM } from '../../utils';

const BottomBarComp = ({ toggleIsPeopleOpen, toggleIsMessaging, bottomBarData }) => {
    const { socketRef, screenStreamRef } = useSocket();
    const navigate = useNavigate();
    const toggleVideoPlaying = () => {
        socketRef.current.emit("toggleVideo:request");
    }
    const toggleAudioPlaying = () => {
        socketRef.current.emit("toggleAudio:request");
    }
    const toggleScreenSharing = async () => {
        try {
            if (!screenStreamRef.current) {
                screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
                screenStreamRef.current.getVideoTracks()[0].onended = () => {
                    socketRef.current.emit("toggleScreenSharing:request");
                }
            }
            socketRef.current.emit("toggleScreenSharing:request");
        } catch (err) {
            toast.error('This permission is required to screen sharing!');
        }
    }
    const onLeave = () => {
        if (screenStreamRef.current)
            screenStreamRef.current.getVideoTracks()[0].stop();
        toast.success('Leaved room!')
        navigate('/', { replace: true })
    }

    return (
        <div className={styles.bottomBarComp}>
            <div className={styles.left}></div>
            <div className={styles.middle}>
                <button onClick={toggleVideoPlaying}>{bottomBarData.isVideoOn ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}</button>
                <button onClick={toggleAudioPlaying}>{bottomBarData.isMicOn ? <BsFillMicFill /> : <BsFillMicMuteFill />}</button>
                <button onClick={toggleScreenSharing}>{bottomBarData.isScreenSharing ? <MdOutlineStopScreenShare /> : <MdOutlineScreenShare />}</button>
                <button onClick={onLeave}><MdCallEnd /></button>
            </div>
            <div className={styles.right}>
                <button onClick={toggleIsPeopleOpen}><FaUser /></button>
                <button onClick={toggleIsMessaging}><MdChat /></button>
            </div>
        </div>
    )
}

const Video = ({ togglePinned, socketId, isVideoPlaying, screenShare, isAudioPlaying, pinned, stream, img, name, muted }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && (isVideoPlaying || screenShare))
            ref.current.srcObject = stream;
        else if (ref.current && isAudioPlaying)
            ref.current.srcObject = stream;
    }, [isVideoPlaying, stream, screenShare, isAudioPlaying])


    return (
        <div className={styles.Video}>
            {
                isVideoPlaying || screenShare ? (
                    <video ref={ref} autoPlay muted={muted} className={screenShare ? styles.screenShare : ''}></video>
                ) : (
                    <>
                        <audio autoPlay muted={muted} ref={ref} />
                        <img src={img ? img : '/imgs/avatar.png'} alt={name ? name : 'AVATAR'} />
                    </>
                )
            }
            <p>
                <button onClick={() => togglePinned(socketId, !pinned)} className={pinned ? styles.pin : ''}><MdPushPin /></button>
                {!screenShare && <span>{isAudioPlaying ? <BsFillMicFill /> : <BsFillMicMuteFill />}</span>}
            </p>
            <span>{name ?? "No Name User"}</span>
        </div>
    )
}

const VideoContainerComp = ({ videos, togglePinned }) => {
    const pinnedVideos = useMemo(() => Object.fromEntries(
        Object.entries(videos).filter(([, value]) => value.pinned)
    ), [videos])
    const unPinnedVideos = useMemo(() => Object.fromEntries(
        Object.entries(videos).filter(([, value]) => !value.pinned)
    ), [videos])
    return (
        <div className={`${styles.videoContainerComp} ${Object.keys(pinnedVideos).length !== 0 ? styles.pin : ''}`}>
            {
                Object.keys(pinnedVideos).length !== 0 && (
                    <div className={styles.left}>
                        {
                            Object.keys(pinnedVideos).map(key => (
                                <Video
                                    key={key}
                                    pinned={videos[key].pinned}
                                    isAudioPlaying={videos[key].isAudioPlaying}
                                    isVideoPlaying={videos[key].isVideoPlaying}
                                    screenShare={videos[key].screenShare}
                                    stream={videos[key].stream}
                                    img={videos[key].img}
                                    name={videos[key].name}
                                    muted={videos[key].muted}
                                    socketId={key}
                                    togglePinned={togglePinned}
                                />
                            ))
                        }
                    </div>
                )
            }
            {
                Object.keys(unPinnedVideos).length !== 0 ? (
                    <div className={styles.right}>
                        {
                            Object.keys(unPinnedVideos).map(key => (
                                <Video
                                    key={key}
                                    pinned={videos[key].pinned}
                                    isAudioPlaying={videos[key].isAudioPlaying}
                                    isVideoPlaying={videos[key].isVideoPlaying}
                                    screenShare={videos[key].screenShare}
                                    stream={videos[key].stream}
                                    img={videos[key].img}
                                    name={videos[key].name}
                                    muted={videos[key].muted}
                                    socketId={key}
                                    togglePinned={togglePinned}
                                />
                            ))
                        }
                    </div>
                ) : (
                    <div className={styles.right}>
                        <p>There&#39;s no item to show.</p>
                    </div>
                )
            }
        </div >
    )
}

const MessageComp = ({ isMe, name, time, message }) => {
    return (
        <div className={`${styles.messageComp} ${isMe ? styles.me : ''}`}>
            <div className={styles.message}>
                <span>{name}</span>
                <p>{message}</p>
                <span>{time}</span>
            </div>
        </div>
    )
}

const MessageBoxComp = ({ isMessaging, onClose, toggleIsMessaging }) => {
    const ref = useRef(null);
    const InputRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const { socketRef } = useSocket();
    const user = useSelector(store => store.user)

    useClickOutsideExtra(ref, isMessaging, () => {
        onClose();
    })

    useEffect(() => {
        if (isMessaging && InputRef.current)
            InputRef.current.focus();
    }, [isMessaging])

    useEffect(() => {
        const onNewMessage = ({ socketId, message, name }) => {
            setMessages(p => [...p, {
                message,
                name,
                isMe: socketRef.current.id === socketId,
                time: formatAMPM(new Date(Date.now()))
            }])
        }

        console.log('Adding events to ws for new message...');
        socketRef.current.on('message', onNewMessage);
        const socket = socketRef.current;
        return () => {
            console.log('Adding events to ws for new message...');
            socket.on('message', onNewMessage);
        }
    }, [socketRef])

    const onSubmit = e => {
        e.preventDefault();
        socketRef.current.emit("message", { message: inputValue, name: user.name })
        setInputValue('');
    }

    return (
        <div ref={ref} className={`${styles.messageBoxComp} ${isMessaging ? styles.open : ''}`}>
            <div className={styles.top}>
                <div className={styles.top}>
                    <h2>In-Call Messages</h2>
                    <button onClick={toggleIsMessaging}><MdOutlineClose /></button>
                </div>
                <p>Messages can only be seen by people in the call and are deleted when the call ends.</p>
            </div>
            <div className={styles.middle}>
                {
                    messages.map((message, key) => (
                        <MessageComp {...message} key={key} />
                    ))
                }
            </div>
            <form className={styles.bottom} onSubmit={onSubmit}>
                <input ref={InputRef} type="text" placeholder='Enter message?' value={inputValue} onChange={e => setInputValue(e.target.value)} />
                <button type='submit'><MdSend /></button>
            </form>
        </div>
    )
}

const PeopleComp = ({ onClick, pinned, img, email, name }) => {
    return (
        <div className={styles.peopleComp}>
            <div className={styles.left}>
                <img src={img ? img : "/imgs/avatar.png"} alt={name ? name : "AVATAR"} />
                <div className={styles.right}>
                    <p>{name ?? "No Name User"}</p>
                    <span>{email ?? 'No Email User'}</span>
                </div>
            </div>
            <div className={styles.right}>
                <button onClick={onClick} className={pinned ? styles.pinned : ''}><MdPushPin /></button>
            </div>
        </div>
    )
}

const PeopleBoxComp = ({ togglePinned, videos, isPeopleOpen, onClose, toggleIsPeopleOpen }) => {
    const ref = useRef(null);
    const InputRef = useRef(null);
    const { connectedUserRef, socketRef } = useSocket();
    const user = useSelector(store => store.user);
    const [filteredVideos, setFilteredVideos] = useState({});
    const [inputValue, setInputValue] = useState('');
    const getEmail = socketId => {
        if (socketId.startsWith('screen') && connectedUserRef.current[socketId.slice(6)]?.email)
            return connectedUserRef.current[socketId.slice(6)].email;
        else if (connectedUserRef.current[socketId]?.email)
            return connectedUserRef.current[socketId].email;
        else if (socketRef.current.id === socketId)
            return user.email;
        else
            return null;
    }

    useClickOutsideExtra(ref, isPeopleOpen, () => {
        onClose();
    })

    useEffect(() => {
        if (isPeopleOpen && InputRef.current)
            InputRef.current.focus();
    }, [isPeopleOpen])

    useEffect(() => {
        setFilteredVideos(
            Object.fromEntries(
                Object.entries(videos).filter(([, value]) => (value.name.toLowerCase().startsWith(inputValue.toLowerCase())))
            )
        )
    }, [videos, inputValue])

    return (
        <div ref={ref} className={`${styles.peopleBoxComp} ${isPeopleOpen ? styles.open : ''}`}>
            <div className={styles.top}>
                <h2>People</h2>
                <button onClick={toggleIsPeopleOpen}><MdOutlineClose /></button>
            </div>
            <div className={styles.middle}>
                <span><MdSearch /></span>
                <input ref={InputRef} type="text" required placeholder='Search for people' value={inputValue} onChange={e => setInputValue(e.target.value)} />
            </div>
            <div className={styles.bottom}>
                {
                    Object.keys(filteredVideos).map(key => (
                        <PeopleComp
                            key={key}
                            pinned={filteredVideos[key].pinned}
                            img={filteredVideos[key].img}
                            email={getEmail(key)}
                            name={filteredVideos[key].name}
                            onClick={() => togglePinned(key, !filteredVideos[key].pinned)}
                        />
                    ))
                }
            </div>
        </div>
    )
}

const Room = () => {
    const [bottomBarData, setBottomBarData] = useStateWithCallback({
        isVideoOn: true,
        isMicOn: true,
        isScreenSharing: false,
    })
    const [isMessaging, setIsMessaging] = useState(false);
    const [isPeopleOpen, setIsPeopleOpen] = useState(false);
    const onMessagingClose = () => setIsMessaging(false);
    const toggleIsMessaging = () => setIsMessaging(p => !p);
    const onPeopleClose = () => setIsPeopleOpen(false);
    const toggleIsPeopleOpen = () => setIsPeopleOpen(p => !p);
    const { localStreamRef, peerRef, socketRef, connectedUserRef, screenStreamRef } = useSocket();
    const [videos, setVideos] = useStateWithCallback({});
    const user = useSelector(store => store.user);
    const callsRef = useRef({});
    const screenSharingCallsRef = useRef({});

    useEffect(() => {
        const onUserJoined = ({ socketId, userInfo }) => {
            connectedUserRef.current = { ...connectedUserRef.current, [socketId]: userInfo };
            if (bottomBarData.isScreenSharing) {
                console.log('calling....');
                const call = peerRef.current.call(userInfo.peerId, screenStreamRef.current, { metadata: { type: 'screen' } });
                screenSharingCallsRef.current[socketId] = call;

                call.on('close', () => {
                    call.close();
                    delete screenStreamRef.current[socketId];
                })
            }
        }
        console.log('Adding events to ws for new user joined...');
        socketRef.current.on('newUser:joined', onUserJoined);
        const socket = socketRef.current;
        return () => {
            console.log('Removing events from ws for user joined...');
            socket.off('newUser:joined', onUserJoined);
        }
    }, [bottomBarData, connectedUserRef, peerRef, screenStreamRef, socketRef])

    useEffect(() => {
        const onUserLeave = ({ socketId }) => {
            setVideos(p => {
                const updatedVideos = { ...p };
                return Object.fromEntries(
                    Object.entries(updatedVideos).filter(([key]) => (key !== socketId && key !== `screen${socketId}`))
                );
            })

            if (callsRef.current[socketId]) {
                const call = callsRef.current[socketId];
                call.close();
                delete callsRef.current[socketId];
            }
            if (screenSharingCallsRef.current[socketId]) {
                const call = screenSharingCallsRef.current[socketId];
                call.close();
                delete screenSharingCallsRef.current[socketId];
            }

            const user = connectedUserRef.current[socketId];
            toast.info(`${user.name} leaved!`);
        }
        console.log('Adding events to ws for user leave...');
        socketRef.current.on('user:leave', onUserLeave)
        const socket = socketRef.current;
        return () => {
            console.log('removing events from ws for user leave...');
            socket.off('user:leave', onUserLeave)
        }
    }, [connectedUserRef, setVideos, socketRef])

    useEffect(() => {
        const localVideo = {
            pinned: false,
            isAudioPlaying: true,
            isVideoPlaying: true,
            screenShare: false,
            stream: localStreamRef.current,
            img: user.file,
            name: user.name,
            muted: true,
        }
        setVideos(p => ({
            ...p,
            [socketRef.current.id]: localVideo
        }))
    }, [localStreamRef, setVideos, socketRef, user]);

    useEffect(() => {
        const onVideoToggleFulfiled = ({ fromSocketId, isVideoOn }) => {
            if (fromSocketId === socketRef.current.id) {
                setBottomBarData(p => ({ ...p, isVideoOn }));
                localStreamRef.current.getVideoTracks()[0].enabled = isVideoOn
                if (isVideoOn) toast.success('Turn on camera!');
                else toast.success('Turn off camera!');
            } else {
                const name = connectedUserRef.current[fromSocketId].name;
                if (isVideoOn)
                    toast.info(`${name} is turned on camera!`);
                else
                    toast.info(`${name} is turned off camera!`);
            }
            setVideos(p => ({ ...p, [fromSocketId]: { ...p[fromSocketId], isVideoPlaying: isVideoOn } }));
        }
        const onVideoToggleRejected = () => {
            toast.error("Something went wrong. Please try again!");
        }

        console.log('Adding events to ws for video Toggle...');
        socketRef.current.on('toggleVideo:fulfilled', onVideoToggleFulfiled);
        socketRef.current.on('toggleVideo:rejected', onVideoToggleRejected);
        const socket = socketRef.current;
        return () => {
            console.log('removing events from ws for video Toggle...');
            socket.off('toggleVideo:fulfilled', onVideoToggleFulfiled);
            socket.off('toggleVideo:rejected', onVideoToggleRejected);
        }
    }, [connectedUserRef, localStreamRef, setBottomBarData, setVideos, socketRef])

    useEffect(() => {
        const onAudioToggleFulfiled = ({ fromSocketId, isMicOn }) => {
            if (fromSocketId === socketRef.current.id) {
                setBottomBarData(p => ({ ...p, isMicOn }));
                localStreamRef.current.getAudioTracks()[0].enabled = isMicOn
                if (isMicOn) toast.success('Turn on mic!');
                else toast.success('Turn off mic!');
            } else {
                const name = connectedUserRef.current[fromSocketId].name;
                if (isMicOn)
                    toast.info(`${name} is turned on mic!`);
                else
                    toast.info(`${name} is turned off mic!`);
            }
            setVideos(p => ({ ...p, [fromSocketId]: { ...p[fromSocketId], isAudioPlaying: isMicOn } }));
        }

        const onAudioToggleRejected = () => {
            toast.error("Something went wrong. Please try again!");
        }

        console.log('Adding events to ws for audio Toggle...');
        socketRef.current.on('toggleAudio:fulfilled', onAudioToggleFulfiled);
        socketRef.current.on('toggleAudio:rejected', onAudioToggleRejected);
        const socket = socketRef.current;
        return () => {
            console.log('removing events from ws for audio Toggle...');
            socket.off('toggleAudio:fulfilled', onAudioToggleFulfiled);
            socket.off('toggleAudio:rejected', onAudioToggleRejected);
        }
    }, [connectedUserRef, localStreamRef, setBottomBarData, setVideos, socketRef])

    const togglePinned = (socketId, newValue) => {
        setVideos(p => ({ ...p, [socketId]: { ...p[socketId], pinned: newValue } }))
    }

    const peerIdToSocketId = useCallback((peerId) => {
        for (const socketId in connectedUserRef.current) {
            const user = connectedUserRef.current[socketId];
            if (user.peerId === peerId)
                return socketId;
        }
        return null;
    }, [connectedUserRef]);

    useEffect(() => {
        console.log('Add events to peer for call receiving...');
        peerRef.current.on('call', call => {
            if (call?.metadata?.type && call.metadata.type === 'screen') {
                call.answer();
                const callerId = call.peer;
                const socketId = peerIdToSocketId(callerId);
                const user = connectedUserRef.current[socketId];
                call.on('stream', stream => {
                    const localVideo = {
                        pinned: true,
                        isAudioPlaying: false,
                        isVideoPlaying: false,
                        screenShare: true,
                        stream,
                        img: user.img,
                        name: user.name,
                        muted: true,
                    }
                    setVideos(p => ({
                        ...p,
                        [`screen${socketId}`]: localVideo
                    }))
                })

                callsRef.current[socketId] = call;
                toast.info(`${user.name} is turned on screen sharing!`);

                call.on('close', () => {
                    delete callsRef.current[socketId];
                    setVideos(p => {
                        const updatedVideos = { ...p };
                        delete updatedVideos[`screen${socketId}`];
                        return updatedVideos;
                    });
                    call.close();
                    toast.info(`${user.name} is turned off screen sharing!`);
                });
            } else {
                call.answer(localStreamRef.current);
                const callerId = call.peer;
                const socketId = peerIdToSocketId(callerId);
                const user = connectedUserRef.current[socketId];
                call.on('stream', stream => {
                    const localVideo = {
                        pinned: false,
                        isAudioPlaying: true,
                        isVideoPlaying: true,
                        screenShare: false,
                        stream,
                        img: user.img,
                        name: user.name,
                        muted: false,
                    }
                    setVideos(p => ({
                        ...p,
                        [socketId]: localVideo
                    }))
                })
                callsRef.current[socketId] = call;

                call.on('close', () => {
                    callsRef.current[socketId];
                    setVideos(p => {
                        const updatedVideos = { ...p };
                        delete updatedVideos[socketId];
                        return updatedVideos;
                    });
                    call.close();
                })
            }
        });
    }, [connectedUserRef, localStreamRef, peerIdToSocketId, peerRef, setVideos, socketRef, user]);

    useEffect(() => {
        console.log('Calling to users which are already in room...');
        for (const socketId in connectedUserRef.current) {
            const user = connectedUserRef.current[socketId];
            const call = peerRef.current.call(user.peerId, localStreamRef.current);
            call.on('stream', stream => {
                const localVideo = {
                    pinned: false,
                    isAudioPlaying: user.isMicOn,
                    isVideoPlaying: user.isVideoOn,
                    screenShare: false,
                    stream,
                    img: user.img,
                    name: user.name,
                    muted: false,
                }
                setVideos(p => ({
                    ...p,
                    [socketId]: localVideo
                }))
            })
            callsRef.current[socketId] = call;
        }
    }, [connectedUserRef, localStreamRef, peerRef, setVideos])

    useEffect(() => {
        const onScreenSharingToggleFulfiled = ({ fromSocketId, isScreenSharing }) => {
            if (fromSocketId === socketRef.current.id) {
                setBottomBarData(p => ({ ...p, isScreenSharing }));
                if (isScreenSharing) {
                    const localScreen = {
                        pinned: true,
                        isAudioPlaying: false,
                        isVideoPlaying: false,
                        screenShare: true,
                        stream: screenStreamRef.current,
                        img: user.img,
                        name: user.name,
                        muted: true,
                    }
                    setVideos(p => ({
                        ...p,
                        [`screen${fromSocketId}`]: localScreen
                    }))
                    for (const socketId in connectedUserRef.current) {
                        const user = connectedUserRef.current[socketId];
                        const call = peerRef.current.call(user.peerId, screenStreamRef.current, { metadata: { type: 'screen' } });
                        screenSharingCallsRef.current[fromSocketId] = call;

                        call.on('close', () => {
                            call.close();
                            delete screenStreamRef.current[fromSocketId];
                        })
                    }
                    toast.success('Turn on screen sharing!')
                }
                else {
                    for (const socketId in screenSharingCallsRef.current) {
                        const call = screenSharingCallsRef.current[socketId];
                        call.close();
                    }
                    screenSharingCallsRef.current = {};
                    setVideos(p => {
                        const updatedVideos = { ...p };
                        delete updatedVideos[`screen${fromSocketId}`];
                        return updatedVideos;
                    });
                    screenStreamRef.current.getVideoTracks()[0].stop();
                    screenStreamRef.current = null;
                    toast.success('Turn off screen sharing!')
                }
            }
        }

        const onScreenSharingToggleRejected = () => {
            toast.error("Something went wrong. Please try again!");
        }

        console.log('Adding events to ws for screen share Toggle...');
        socketRef.current.on('toggleScreenSharing:fulfilled', onScreenSharingToggleFulfiled);
        socketRef.current.on('toggleScreenSharing:rejected', onScreenSharingToggleRejected);
        const socket = socketRef.current;
        return () => {
            console.log('removing events from ws for screen share Toggle...');
            socket.off('toggleScreenSharing:fulfilled', onScreenSharingToggleFulfiled);
            socket.off('toggleScreenSharing:rejected', onScreenSharingToggleRejected);
        }
    }, [connectedUserRef, peerRef, screenStreamRef, setBottomBarData, setVideos, socketRef, user])

    return (
        <div className={styles.container}>
            <div className={styles.videosContainer}>
                <VideoContainerComp videos={videos} togglePinned={togglePinned} />
            </div>
            <div className={styles.bottombar}>
                <BottomBarComp toggleIsPeopleOpen={toggleIsPeopleOpen} toggleIsMessaging={toggleIsMessaging} bottomBarData={bottomBarData} setBottomBarData={setBottomBarData} />
            </div>

            <MessageBoxComp isMessaging={isMessaging} onClose={onMessagingClose} toggleIsMessaging={toggleIsMessaging} />
            <PeopleBoxComp togglePinned={togglePinned} videos={videos} isPeopleOpen={isPeopleOpen} onClose={onPeopleClose} toggleIsPeopleOpen={toggleIsPeopleOpen} />
        </div>
    )
}

export default Room