import './PageGlobal.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function RegisterPage({ handleRegister, registerForm, setRegisterForm, error, setError, success, setSuccess }) {

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        setSuccess(''); 
        await handleRegister(); // Call the handleRegister function passed from App.jsx
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setRegisterForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    return (
        <div className='pagelayout'>
            <motion.h1
                className='about-heading'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                Register
            </motion.h1>

            <motion.div
                className='box'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            >
                <form onSubmit={handleSubmit}>
                    {error && <p >{error}</p>}
                    {success && <p >{success}</p>}

                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={registerForm.name}
                        onChange={handleFormChange}
                    />

                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={registerForm.email}
                        onChange={handleFormChange}
                    />

                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={registerForm.password}
                        onChange={handleFormChange}
                    />

                    <label htmlFor="password_confirmation">Confirm Password:</label>
                    <input
                        type="password"
                        id="password_confirmation" 
                        name="password_confirmation" 
                        required
                        value={registerForm.password_confirmation}
                        onChange={handleFormChange}
                    />

                    <label htmlFor="role-select">Register as:</label>
                    <select
                        id="role-select"
                        name="role"
                        value={registerForm.role}
                        onChange={handleFormChange}
                    >
                        <option className='linkp' value="client">Client</option>
                        <option className='linkp' value="stylist">Stylist</option>
                    </select>

                    <button type="submit" className='button-nav'>Register</button>
                    <p className='linkp'>Already have an account? <Link to="/login" className='link'>Login</Link></p>
                </form>
            </motion.div>
        </div>
    );
}