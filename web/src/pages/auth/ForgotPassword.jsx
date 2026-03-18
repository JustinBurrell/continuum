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
      <div className="text-center py-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}
        >
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2
          className="text-xl font-bold text-[#6b21a8] mb-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Check your email
        </h2>
        <p className="text-sm text-[#a087b0] mb-7 leading-relaxed max-w-xs mx-auto">
          We sent a password reset link to your inbox. Follow the instructions to set a new password.
        </p>
        <Link
          to="/login"
          className="text-sm text-[#6b21a8] font-semibold hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-7 text-center">
        <h1
          className="text-2xl font-bold text-[#6b21a8] mb-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Reset your password
        </h1>
        <p className="text-sm text-[#a087b0]">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
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

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-[#a087b0]">
        Remembered your password?{' '}
        <Link to="/login" className="text-[#6b21a8] font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
