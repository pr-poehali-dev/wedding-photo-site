import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
  loading: boolean;
}

export default function LoginForm({ onLogin, loading }: LoginFormProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    await onLogin(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20 flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-light text-center">Вход в админ-панель</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !password}
            className="w-full"
          >
            <Icon name="LogIn" size={20} className="mr-2" />
            Войти
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            <Icon name="Home" size={20} className="mr-2" />
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
