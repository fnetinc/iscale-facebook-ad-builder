import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './context/BrandContext';
import { CampaignProvider } from './context/CampaignContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateAds from './pages/CreateAds';
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
import Research from './pages/Research';
import AdRemix from './pages/AdRemix';
import Settings from './pages/Settings';

function App() {
  return (
    <ToastProvider>
      <BrandProvider>
        <CampaignProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="research" element={<Research />} />
                <Route path="build-creatives" element={<CreateAds />} />
                <Route path="image-ads" element={<ImageAds />} />
                <Route path="video-ads" element={<VideoAds />} />
                <Route path="facebook-campaigns" element={<FacebookCampaigns />} />
                <Route path="winning-ads" element={<WinningAds />} />
                <Route path="generated-ads" element={<GeneratedAds />} />
                <Route path="brands" element={<Brands />} />
                <Route path="products" element={<Products />} />
                <Route path="profiles" element={<CustomerProfiles />} />
                <Route path="ad-remix" element={<AdRemix />} />
                <Route path="reporting" element={<Reporting />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CampaignProvider>
      </BrandProvider>
    </ToastProvider>
  );
}

export default App;
