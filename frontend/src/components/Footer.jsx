import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';
import api from '../lib/api';

export default function Footer() {
  const [footerData, setFooterData] = useState(null);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const res = await api.get('/footer');
        if (res.data) {
          setFooterData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    };
    fetchFooter();
  }, []);

  if (!footerData) return null;

  return (
    <footer className="bg-gray-900 text-gray-300 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 w-full mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Address */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-tight">Nanban Restaurant</h3>
          {footerData.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{footerData.address}</p>
            </div>
          )}
        </div>

        {/* Contact Us */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Contact Us</h4>
          <ul className="space-y-3">
            {footerData.phone && (
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`tel:${footerData.phone}`} className="text-sm hover:text-orange-400 transition-colors">
                  {footerData.phone}
                </a>
              </li>
            )}
            {footerData.email && (
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`mailto:${footerData.email}`} className="text-sm hover:text-orange-400 transition-colors">
                  {footerData.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Follow Us */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Follow Us</h4>
          <div className="flex items-center gap-4">
            {footerData.instagramLink && (
              <a 
                href={footerData.instagramLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {footerData.facebookLink && (
              <a 
                href={footerData.facebookLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

      </div>

      {/* Copyright */}
      {footerData.copyrightText && (
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">{footerData.copyrightText}</p>
        </div>
      )}
    </footer>
  );
}
