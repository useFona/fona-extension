import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { LoginProps } from '../types';

// Logo and Brand Component
const LogoAndBrand: React.FC = () => {
  return (
    <div className="p-4 bg-[#191919] rounded-lg border border-[#242424] mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img
            src={browser.runtime.getURL('/wxt.svg')}
            alt="Fona Logo"
            className="w-14 h-12 rounded"
          />
          <div className="text-5xl font-bold text-[#DC586D]">Fona</div>
        </div>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://fona.meet-jain.in/release-notes/#v${browser.runtime.getManifest().version
            }`}
          className="text-xs px-2 py-1 bg-[#242424] text-[#DC586D] rounded-lg border border-[#292929] hover:bg-[#2a2a2a] transition-colors"
        >
          v{browser.runtime.getManifest().version}
        </a>
      </div>
      <hr className="border-[#292929] mb-3" />
      <div className="text-base text-[#7b7b7d] text-center">
        your flow oriented notes application !
      </div>
    </div>
  );
};

// Animated Flow Instructions Component
const AnimatedInstructions: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "1- visit fona's dashboard",
    "2- generate a new token and copy !",
    "3- paste the token here to sync app !!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000); // Changed to 2 seconds for better readability

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-[#191919] rounded-lg border border-[#242424] mb-4">
      <h3 className="text-lg font-bold text-[#7b7b7d] mb-3 text-left">
        Here's the flow !
      </h3>
      <div className="bg-[#242424] rounded-lg p-3 border border-[#292929]">
        <div className="text-lg font-bold text-[#a54656] text-center transition-all duration-500">
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
};

// Login Form Component
const LoginForm: React.FC<{
  userToken: string;
  setUserToken: (token: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}> = ({ userToken, setUserToken, onSubmit, isLoading, error }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="p-4 bg-[#191919] rounded-lg border border-[#242424] mb-4">
      <div className="text-center mb-4">
        <User size={32} className="text-[#7b7b7d] mb-2 mx-auto" />
        <h2 className="m-0 mb-2 text-base font-bold text-[#7b7b7d]">Login</h2>
        <p className="text-[#7b7b7d] text-xs m-0">
          Enter your user token to continue
        </p>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={userToken}
          onChange={(e) => setUserToken(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your user token"
          className="w-full p-2.5 border border-[#292929] rounded-lg text-sm box-border bg-[#242424] text-[#7b7b7d] outline-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={`w-full p-2.5 bg-[#242424] text-[#7b7b7d] border border-[#292929] rounded-lg text-base font-bold transition-all duration-200 ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#2a2a2a]'
          }`}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      {error && (
        <div className="mt-2.5 p-2 bg-[#2d1b1b] border border-[#4a2626] rounded-lg text-[#ff6b6b] text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

// Dashboard Button Component
const DashboardButton: React.FC = () => {
  return (
    <div className="p-2 bg-[#191919] rounded-lg border border-[#242424] hover:bg-[#2a2a2a]">
      <a
        href="https://fona.meet-jain.in/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full p-2 text-[#36659b] rounded-xl font-extrabold text-2xl text-center no-underline"
      >
        Dashboard
      </a>
    </div>
  );
};

const Login: React.FC<LoginProps> = ({
  userToken,
  setUserToken,
  onSubmit,
  isLoading,
  error
}) => {
  return (
    <div className="w-[420px] h-[675px] p-4 bg-[#161616] border border-[#292929] overflow-y-auto">
      <LogoAndBrand />

      <AnimatedInstructions />
      <LoginForm
        userToken={userToken}
        setUserToken={setUserToken}
        onSubmit={onSubmit}
        isLoading={isLoading}
        error={error}
      />
      <DashboardButton />
    </div>
  );
};

export default Login;
