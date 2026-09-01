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
      <div className="login-page__form-side">
        <div className="login-page__form-inner">
          <InstallPWABanner />

          <div className="login-page__brand">
            <img
              src="/sforce-logo.webp"
              alt="Sales Force"
              className="login-page__logo-img"
            />
          </div>

          <h1 className="login-page__heading">Welcome back</h1>
          <p className="login-page__subtext">
            Sign in to your Sales Force workspace to manage leads and close deals.
          </p>

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
              helperText="At least 6 characters"
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

      <aside className="login-page__visual-side">
        <div className="login-page__visual-grid" />
        <div className="login-page__visual-glow" />

        <div className="login-page__visual-content">
          <div className="login-page__visual-header">
            <h2 className="login-page__visual-title">
              Your sales pipeline, under control.
            </h2>
            <p className="login-page__visual-subtitle">
              The CRM built for real estate sales teams. Track every lead and close
              faster from anywhere.
            </p>
          </div>

          <div className="login-page__visual-screenshot">
            <div className="login-page__browser-bar">
              <div className="login-page__browser-dots">
                <div className="login-page__browser-dot login-page__browser-dot--red" />
                <div className="login-page__browser-dot login-page__browser-dot--yellow" />
                <div className="login-page__browser-dot login-page__browser-dot--green" />
              </div>
              <div className="login-page__browser-url">
                salesforce.app
              </div>
            </div>
            <img
              src="/features/dashboard.png"
              alt="Sales Force CRM dashboard"
              className="login-page__screenshot-img"
            />
          </div>
        </div>

      </aside>
    </div>
  );
}
