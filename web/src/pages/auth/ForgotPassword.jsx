import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={24} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-secondary mb-6">
          We've sent a password reset link. Check your inbox and follow the instructions.
        </p>
        <Link to="/login" className="text-primary text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-foreground">Reset your password</h1>
        <p className="text-sm text-secondary mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          {...register('email', { required: true })}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-secondary">
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
