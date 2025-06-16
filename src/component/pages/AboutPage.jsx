import './PageGlobal.css';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        About Us
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        
      >
        <p style={{marginLeft:"20px"}}>Features of this page. Clients can Use AI to generate colors based what prompt you give and will apply to the 3D model, you can save the generated color. They can also ask an Stylist to make a 3d model for you. Clients can also update their profile .  As a Stylist you can also use AI to generate color and apply to model. Stylist can upload a 3d model for their clients.Admin can perform CRUD functionality on clients and stylists they can also upload and delete models .</p>
      </motion.div>
    </div>
  );
}
