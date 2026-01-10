import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { saveCredentials, getCredentials, setAuthenticated } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface LoginPageProps {
  onLogin: () => void;
}

// Default credentials
const VALID_USERNAME = 'abhishekh_dey';
const VALID_PASSWORD = "D1asdfghjkl;'";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved credentials on mount
    const saved = getCredentials();
    if (saved) {
      setUsername(saved.username);
      setPassword(saved.password);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a brief loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate credentials
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      saveCredentials({ username, password });
      setAuthenticated(true);
      toast({
        title: 'Welcome back!',
        description: 'Successfully authenticated.',
      });
      onLogin();
    } else {
      toast({
        title: 'Authentication Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Animated glow orb */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />

      <div className="relative glass-card w-full max-w-md p-8 animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 glow-primary">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Team WolfPack</h1>
          <p className="text-muted-foreground mt-2">Sales Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="input-dark"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-dark pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold btn-glow transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Secure access to sales analytics
        </p>
      </div>
    </div>
  );
}
