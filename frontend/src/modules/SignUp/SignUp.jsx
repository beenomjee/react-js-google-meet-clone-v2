import { useDispatch, useSelector } from 'react-redux'
import styles from './SingUp.module.scss'
import { signUpUser } from '../../store'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Input, Loader } from '../../components'
import { Link, useNavigate } from 'react-router-dom'



const SignUp = () => {
    const dispatch = useDispatch();
    const userEmail = useSelector(store => store.user.email)
    const isLoading = useSelector(store => store.user.isLoading)
    const [isLoading2, setIsLoading2] = useState(true);
    const navigate = useNavigate();
    const ref = useRef(null);
    const [data, setData] = useState({
        email: '', password: '', fName: '', lName: '', file: '',
    })
    const onSubmit = e => {
        e.preventDefault();
        dispatch(signUpUser(data))
    }

    const onChange = e => {
        const id = e.target.id;
        if (id === 'file') {
            const reader = new FileReader();
            reader.onload = () => {
                setData(p => ({ ...p, [id]: reader.result }))
            }
            reader.onerror = () => {
                toast.error("Something went wrong in loading file. Please try again.")
            }
            reader.readAsDataURL(e.target.files[0]);
        }
        else
            setData(p => ({ ...p, [id]: e.target.value }))
    }

    useEffect(() => {
        if (userEmail)
            navigate('/', { replace: true });
        else
            setIsLoading2(false)
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
                    <h1>Sign Up</h1>
                    <Input ref={ref} id="fName" value={data.fName} onChange={onChange} label="First Name" type="text" required placeholder="What's your first name?" />
                    <Input id="lName" value={data.lName} onChange={onChange} label="Last Name" type="text" required placeholder="What's your last name?" />
                    <Input id="email" value={data.email} onChange={onChange} label="Email" type="email" required placeholder="What's your email address?" />
                    <Input id="password" value={data.password} onChange={onChange} label="Password" type="password" required placeholder="Password for authentication" autoComplete='on' />
                    <Input id="file" onChange={onChange} label="Image" type="file" accept="image/*" className={styles.img} ><img src={data.file ? data.file : "/imgs/avatar.png"} alt='AVATAR' /></Input>
                    <button type='submit'>Sign Up</button>
                    <p>Already have account? <Link to='/signin'>Sign In</Link></p>
                </form>
            </div>
        )

    )
}

export default SignUp