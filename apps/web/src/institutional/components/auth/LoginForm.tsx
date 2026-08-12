import { useState, FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Alert, AlertDescription } from '@/institutional/components/ui-ssh/alert-ssh';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from '@/institutional/contexts/AuthContext';
import { motion } from 'framer-motion';

interface LoginFormProps {
  role: UserRole;
  accentColor: string;
  redirectTo: string;
}

const DEMO_HINTS: Record<UserRole, string> = {
  student:    'student@example.com / student123',
  faculty:    'faculty@example.com / faculty123',
  admin:      'admin@example.com / admin123',
  government: 'government@example.com / govt123',
  parent:     'parent@example.com / parent123',
};

const containerVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const LoginForm = ({ role, accentColor, redirectTo }: LoginFormProps) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      const success = await login(email, password, role);

      if (success) {
        navigate({ to: ('/institutional' + redirectTo) as any });
      } else {
        setError(
          `Invalid credentials or this account is not authorized for the ${
            role.charAt(0).toUpperCase() + role.slice(1)
          } portal. Please check your details and try again.`
        );
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const showDemoHint = import.meta.env.VITE_SHOW_DEMO_HINTS === 'true';

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div variants={itemVariants} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: undefined }));
                }}
                className={`pl-10 focus-ring ${validationErrors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="email"
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
            </div>
            {validationErrors.email && (
              <p id="email-error" className="text-sm text-destructive animate-fade-in" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) setValidationErrors((p) => ({ ...p, password: undefined }));
                }}
                className={`pl-10 pr-10 focus-ring ${validationErrors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="current-password"
                aria-describedby={validationErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-destructive animate-fade-in" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            id={`login-btn-${role}`}
            className={`w-full ${accentColor} hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] focus-ring`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In…
              </>
            ) : (
              `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            )}
          </Button>
        </motion.div>

        {/* Demo hint — only shown when VITE_SHOW_DEMO_HINTS=true */}
        {showDemoHint && (
          <motion.div variants={itemVariants} className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              🧪 Demo credentials: <span className="font-mono">{DEMO_HINTS[role]}</span>
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default LoginForm;