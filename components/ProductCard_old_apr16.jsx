"use client";

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const WishlistButton = ({ productId, onWishlistUpdate,wishliststatus }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  
  useEffect(() => {
    if (wishliststatus !== '' && wishliststatus !== null) {
      setIsWishlisted(wishliststatus);
    }
  }, [wishliststatus]);
  

  const handleWishlist = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowAuthModal(true);
        return;
      }

      const method = isWishlisted ? 'DELETE' : 'POST';
      const methodurl =(method=='POST') ? 'post' : 'delete';
      const response = await fetch('/api/wishlist/'+methodurl, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update wishlist');
      }

      // Toggle the wishlist status
      setIsWishlisted(!isWishlisted);
      
      // Notify parent component about the update
      if (onWishlistUpdate) {
        onWishlistUpdate();
      }

    } catch (error) {
      console.error('Wishlist error:', error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="absolute top-2 right-2 z-10">
        <button 
          className={`p-1 rounded-full bg-white shadow ${isWishlisted ? 'text-red-500' : 'hover:text-red-500'}`}
          onClick={handleWishlist}
          disabled={isLoading}
        >
          <Heart 
            size={18} 
            fill={isWishlisted ? 'currentColor' : 'none'} 
          />
        </button>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleWishlist();
          }}
          error={authError}
        />
      )}
    </>
  );
};

// AuthModal component remains the same as your original code
const AuthModal = ({ onClose, onSuccess, error }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeTab === 'login' ? {
          email: formData.email,
          password: formData.password
        } : {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      
      localStorage.setItem('token', data.token);
      onSuccess();
    } catch (error) {
      console.error('Authentication error:', error);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-2 px-1 ${
              activeTab === 'login' 
                ? 'border-b-2 border-[#d72828] text-[#d72828]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`pb-2 px-1 ${
              activeTab === 'register'
                ? 'border-b-2 border-[#d72828] text-[#d72828]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <input
                type="tel"
                placeholder="Mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
            minLength={6}
          />
          
          {(formError || error) && (
            <div className="text-red-500 text-sm">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d72828] text-white py-2 px-4 rounded hover:bg-[#d72828] disabled:bg-gray-400 transition-colors duration-200"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WishlistButton;