import './HomePage.css';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClothViewer from '../ClothViewer.jsx';

export default function HomePage() {
  return (
    <>
      <motion.div
        className='homepage-title'
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          summer
        </motion.h2>
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Collection
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          2025
        </motion.h2>

        <motion.div
          className="homepage-links"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link className='homepage-nav' to="/collection">Full collection</Link>
          <Link className='homepage-nav' to="/event">Event</Link>
        </motion.div>
      </motion.div>

      <motion.div
        className='model-container'
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1 }}
      >
        <ClothViewer embedMode={true} />
      </motion.div>
    </>
  );
}
