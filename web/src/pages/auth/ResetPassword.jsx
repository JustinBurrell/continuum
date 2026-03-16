import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.password });
      navigate('/login?reset=1');
    } catch (err) {
      setError(err.response?.data?.error || 'Link is invalid or expired. Please request a new one.');
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-foreground">Set new password</h1>
        <p className="text-sm text-secondary mt-1">Choose a strong password for your account</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="Min 8 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Min 8 characters' },
          })}
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Reset password
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
