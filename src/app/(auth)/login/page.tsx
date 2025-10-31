'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setIsSubmitting(true);
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false
    });
    setIsSubmitting(false);
    if (!res || res.error) return alert('Invalid credentials');
    router.replace('/dashboard');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 rounded-lg border p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <div>
          <Label className="block">Email</Label>
          <Input className="mt-1" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <Label className="block">Password</Label>
          <Input className="mt-1" type="password" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
        </div>
        <Button fullWidth disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}


