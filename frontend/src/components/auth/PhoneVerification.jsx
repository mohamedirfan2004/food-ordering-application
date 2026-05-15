// frontend/src/components/auth/PhoneVerification.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axiosConfig';

const PhoneVerification = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('enter-phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await api.post('/customer/send-otp', { phone });
      setStep('verify-otp');
      setMessage({ 
        text: 'OTP sent successfully!', 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to send OTP', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await api.post('/customer/verify-otp', { 
        phone, 
        code 
      });
      
      login(response.data.customer, response.data.token);
      navigate('/');
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to verify OTP', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {step === 'enter-phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Enter Your Phone Number
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We'll send you a verification code
              </p>
            </div>

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="phone" className="sr-only">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="+919345571552"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Verify OTP
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Enter the 6-digit code sent to {phone}
              </p>
            </div>

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="code" className="sr-only">Verification Code</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength="6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {message.text && (
          <div 
            className={`mt-4 p-3 rounded-md ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {step === 'verify-otp' && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setStep('enter-phone');
                setCode('');
              }}
              className="text-sm font-medium text-orange-600 hover:text-orange-500"
            >
              Change phone number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification;