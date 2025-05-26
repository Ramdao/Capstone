import ClothViewer from "./component/ClothViewer.jsx";
import ARClothingViewer from "./component/ARClothingViewer.jsx";
import Upload from "./component/Upload.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeNav from "./component/Navbar/homeNav.jsx";
import HomePage from './component/pages/HomePage.jsx';
import AboutPage from './component/pages/AboutPage.jsx';
import ContactPage from './component/pages/ContactPage.jsx';
import LoginPage from './component/pages/LoginPage.jsx';
import CollectionPage from './component/pages/CollectionPage.jsx';
import EventPage from './component/pages/EventPage.jsx';

import './App.css'
function App() {
  return (
    <>
      {/* <h1>Cloth Viewer</h1>
      <div style={{ height: "90vh" }}>
        <ClothViewer />
        <Upload style={{ marginBottom: "500px" }} />
        <ARClothingViewer />   
      </div> */}
  <video autoPlay muted loop playsInline id="bg-video">
  <source src="/Background/rise.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
    <Router>
      <HomeNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/event" element={<EventPage />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
