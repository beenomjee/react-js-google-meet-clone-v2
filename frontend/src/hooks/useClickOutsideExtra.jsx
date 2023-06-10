import { useCallback, useEffect, useState } from 'react'

const useClickOutside = (ref, stateValue, cb) => {
    const [isOpen, setIsOpen] = useState(stateValue);
    const main = useCallback((e) => {
        if (ref.current === null || ref.current.contains(e.target) || !isOpen || !stateValue)
            return;

        cb(e);
    }, [ref, isOpen, stateValue, cb]);

    useEffect(() => {
        document.addEventListener('click', main);
        return () => {
            document.removeEventListener('click', main);
        }
    }, [main])

    useEffect(() => {
        if (stateValue)
            setIsOpen(true);
        else
            setIsOpen(false);
    }, [stateValue])

}

export default useClickOutside