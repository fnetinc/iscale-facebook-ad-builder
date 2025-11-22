import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './context/BrandContext';
import { CampaignProvider } from './context/CampaignContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImageAds from './pages/ImageAds';
import Wizard from './components/Wizard';
import VideoAds from './pages/VideoAds';
import Reporting from './pages/Reporting';
import Brands from './pages/Brands';
import Products from './pages/Products';
import CustomerProfiles from './pages/CustomerProfiles';
import FacebookCampaigns from './pages/FacebookCampaigns';
import WinningAds from './pages/WinningAds';
import GeneratedAds from './pages/GeneratedAds';

function App() {
  return (
    <BrandProvider>
      <CampaignProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="image-ads" element={<ImageAds />} />
              <Route path="video-ads" element={<VideoAds />} />
              <Route path="facebook-campaigns" element={<FacebookCampaigns />} />
              <Route path="winning-ads" element={<WinningAds />} />
              <Route path="generated-ads" element={<GeneratedAds />} />
              <Route path="brands" element={<Brands />} />
              <Route path="products" element={<Products />} />
              <Route path="customer-profiles" element={<CustomerProfiles />} />
              <Route path="reporting" element={<Reporting />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CampaignProvider>
    </BrandProvider>
  );
}

export default App;
