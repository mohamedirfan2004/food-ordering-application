// frontend/src/components/auth/MobileLogin.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MobileLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Continue as guest
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Customer OTP login has been disabled. You can browse the menu and place orders directly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Go to menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;