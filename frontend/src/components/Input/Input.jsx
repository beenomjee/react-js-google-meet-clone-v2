import { forwardRef } from 'react';
import styles from './Input.module.scss';

const InputComp = ({ label, className, children, ...restProps }, ref) => {
    return (
        <label className={`${styles.input ?? ''} ${className ?? ''}`}>
            <span>{label}</span>
            <div>
                {children && children}
                <input ref={ref} {...restProps} />
            </div>
        </label>
    )
}
const Input = forwardRef(InputComp);
export default Input;