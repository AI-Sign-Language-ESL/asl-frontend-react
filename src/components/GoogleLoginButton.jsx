import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleLoginButton = ({ className, onSuccess, onError: onExternalError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginGoogle } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');

    try {
      const idToken = credentialResponse?.credential;

      if (!idToken) {
        throw new Error('Unable to authenticate with Google.');
      }

      await loginGoogle(idToken);
      onSuccess?.();
      navigate('/home');
    } catch (err) {
      let message;

      if (err.response?.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message = 'Network error. Please try again.';
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.message) {
        message = err.message;
      } else {
        message = 'Unable to authenticate with Google.';
      }

      setError(message);
      onExternalError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    const message = 'Google sign-in was cancelled.';
    setError(message);
    onExternalError?.(message);
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <button
          disabled
          className="w-full bg-white hover:bg-gray-50 text-gray-900 rounded-xl py-3.5 font-bold transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
        >
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Authenticating...
        </button>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="100%"
          type="standard"
        />
      )}
    </div>
  );
};

export default GoogleLoginButton;
