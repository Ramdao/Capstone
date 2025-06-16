import './PageGlobal.css';
import { motion } from 'framer-motion';

export default function ContactPage() {
  return (
  
  <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Contact Us
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        
        
      >
        <p style={{marginLeft:"20px"}}>For inquiries and bug report, please email us at: 
          <a href="mailto:radin00@hotmail.com">Admin</a>
        </p>
      </motion.div>
    </div>
)
}