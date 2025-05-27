import './PageGlobal.css'; 
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LoginPage({ handleLogin, email, password, setEmail, setPassword, error, setError, success, setSuccess }) {

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        setSuccess(''); 
        await handleLogin(); 
    };

    return (
        <div className='pagelayout'>
            <motion.h1
                className='about-heading'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                Login
            </motion.h1>

            <motion.div
                className='box'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            >
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    {success && <p className="text-green-500 text-sm mb-2">{success}</p>}

                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={email}
                        onChange={setEmail} 
                    />
                    
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={setPassword} 
                    />
                    
                    <button type="submit" className='button-nav'>Login</button>
                    <p className='linkp'>Don't have an account? <Link to="/register" className='link'>Register</Link></p>
                </form>
            </motion.div>
        </div>
    );
}