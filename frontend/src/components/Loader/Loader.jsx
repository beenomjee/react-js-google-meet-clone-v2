import React from 'react'
import styles from './Loader.module.scss';
import { BiLoaderAlt } from 'react-icons/bi'

const Loader = () => {
    return (
        <span className={styles.rotate}><BiLoaderAlt /></span>
    )
}

export default Loader