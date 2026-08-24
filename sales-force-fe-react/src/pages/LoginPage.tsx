import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { InstallPWABanner } from '@/components/pwa/InstallPWABanner';
import { useAuth } from '@/contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await api.login(email, password);
      await fetchUser();

      navigate('/dashboard');
    } catch (error) {
      setErrors({ password: error instanceof Error ? error.message : 'Invalid credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        {/* PWA Install Banner */}
        <InstallPWABanner />

        {/* Logo/Brand */}
        <div className="login-page__brand">
          <div className="login-page__logo">
            <svg className="login-page__logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="login-page__title">Sales Force</h1>
          <p className="login-page__tagline">Simple CRM. Powerful Results.</p>
          <p className="login-page__subtitle">Manage customer relationships with ease</p>
        </div>

        {/* Login Card */}
        <div className="login-page__card">
          <form onSubmit={handleSubmit} className="login-page__form">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              leftIcon={<Mail className="login-page__input-icon" />}
              autoComplete="email"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              leftIcon={<Lock className="login-page__input-icon" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-page__password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="login-page__password-toggle-icon" />
                  ) : (
                    <Eye className="login-page__password-toggle-icon" />
                  )}
                </button>
              }
              autoComplete="current-password"
              disabled={isLoading}
            />

            <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="login-page__submit">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
