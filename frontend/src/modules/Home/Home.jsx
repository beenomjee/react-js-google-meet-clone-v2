import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './Home.module.scss';
import { Input, Loader } from '../../components';
import { v4 as uuidV4 } from 'uuid'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CgLogOut } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../../store';
import { logoutFromGoogle } from '../../firebase';

const roomURLInitials = window.location.href + 'room/';

const Home = () => {
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();
    const ref = useRef(null);
    const dispatch = useDispatch();
    const { isLoading } = useSelector(store => store.user);

    const onSubmit = useCallback(e => {
        e.preventDefault();
        const regexExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?isjoin=true$/;
        if (regexExp.test(`${roomId}?isjoin=true`))
            navigate(`room/${roomId}?isjoin=true`);
        else if (roomId.startsWith(roomURLInitials) && regexExp.test(roomId.slice(roomURLInitials.length)))
            navigate(`room/${roomId.slice(roomURLInitials.length)}`);
        else
            toast.error('Invalid room code or link!');

    }, [navigate, roomId])

    const onInstantMeeting = useCallback(() => {
        navigate(`room/${uuidV4()}`);
    }, [navigate])

    useEffect(() => {
        ref.current && ref.current.focus();
    }, [])

    const onLogout = async () => {
        dispatch(setUser({ isLoading: true }));
        logoutFromGoogle(() => {
            dispatch(setUser({ isLoading: false }));
            toast.success('Logged out!');
            dispatch(logout());
        }, () => {
            toast.error('Something went wrong. Please try again!');
            dispatch(setUser({ isLoading: false }));
        });
    }

    return (
        isLoading ? (
            <div className="loader">
                <Loader />
            </div>
        ) : (
            <div className={styles.container}>
                <form onSubmit={onSubmit}>
                    <h1>Meeting</h1>
                    <Input ref={ref} label="Enter a code or link" required placeholder="Link or code of room?" value={roomId} onChange={e => setRoomId(e.target.value)} />
                    <button type='submit'>Join Room</button>
                    <button onClick={onInstantMeeting} type='button'>Start an instant meeting</button>
                </form>
                <button onClick={onLogout}><CgLogOut /></button>
            </div>
        )
    )
}

export default Home