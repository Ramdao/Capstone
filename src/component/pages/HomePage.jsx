import './HomePage.css';
import { Link } from 'react-router-dom';
import ClothViewer from '../ClothViewer.jsx';

export default function HomePage() {
  return (
    <>
      <div className='homepage-title'>
        <h2>summer</h2>
        <h1>Collection</h1>
        <h2>2025</h2>
        <Link className='homepage-nav' to="/collection">Full collection</Link>
        <Link className='homepage-nav' to="/event">Event</Link>
      </div>
      
      <div className='model-container'>
        <ClothViewer embedMode={true} />
      </div>
    </>
  );
}
