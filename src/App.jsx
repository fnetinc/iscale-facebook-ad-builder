import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './context/BrandContext';
import Layout from './components/Layout';
import Wizard from './components/Wizard';
import VideoAds from './pages/VideoAds';
import Reporting from './pages/Reporting';
import Brands from './pages/Brands';

function App() {
  return (
    <BrandProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Wizard />} />
            <Route path="video-ads" element={<VideoAds />} />
            <Route path="brands" element={<Brands />} />
            <Route path="reporting" element={<Reporting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BrandProvider>
  );
}

export default App;
