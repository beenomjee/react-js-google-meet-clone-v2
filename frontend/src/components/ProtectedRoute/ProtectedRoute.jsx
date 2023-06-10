import { useEffect, useState } from 'react'
import { Loader } from '../';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Element }) => {
    const [isLoading, setIsLoading] = useState(true);
    const user = useSelector(store => store.user)
    const navigate = useNavigate();

    useEffect(() => {
        if (!user.email)
            navigate('/signin', { replace: true });
        else
            setIsLoading(false);
    }, [navigate, user])

    return (
        isLoading ? (
            <div className="loader">
                <Loader />
            </div>
        ) : (
            Element
        )
    )
}

export default ProtectedRoute;