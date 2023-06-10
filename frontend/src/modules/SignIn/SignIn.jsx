import { useDispatch, useSelector } from 'react-redux'
import styles from './SingIn.module.scss'
import { signInUser } from '../../store'
import { useEffect, useRef, useState } from 'react'
import { Input, Loader } from '../../components'
import { Link, useNavigate } from 'react-router-dom'



const SignIn = () => {
    const dispatch = useDispatch();
    const userEmail = useSelector(store => store.user.email)
    const isLoading = useSelector(store => store.user.isLoading)
    const [isLoading2, setIsLoading2] = useState(true);
    const navigate = useNavigate();
    const ref = useRef(null);
    const [data, setData] = useState({
        email: '', password: '',
    })
    const onSubmit = e => {
        e.preventDefault();
        dispatch(signInUser(data))
    }

    const onChange = e => {
        const id = e.target.id;
        setData(p => ({ ...p, [id]: e.target.value }))
    }

    useEffect(() => {
        if (userEmail)
            navigate('/', { replace: true });
        else
            setIsLoading2(false);
    }, [navigate, userEmail])

    useEffect(() => {
        if (!isLoading && !isLoading2) {
            ref.current.focus();
        }
    }, [isLoading, isLoading2])

    return (

        isLoading || isLoading2 ? (
            <div className="loader"><Loader /></div>
        ) : (
            <div className={styles.container}>
                <form onSubmit={onSubmit}>
                    <h1>Sign In</h1>
                    <Input ref={ref} id="email" value={data.email} onChange={onChange} label="Email" type="email" required placeholder="What's your email address?" />
                    <Input id="password" value={data.password} onChange={onChange} label="Password" type="password" required placeholder="Password for authentication" autoComplete='on' />
                    <button type='submit'>Sign In</button>
                    <p>Don&#39;t have account? <Link to='/signup'>Sign Up</Link></p>
                </form>
            </div>
        )

    )
}

export default SignIn