import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
                <ShieldCheck className="w-10 h-10 text-primary" />
                <h1 className="text-4xl font-bold font-headline text-primary">CANARA BANK</h1>
            </div>
            <p className="text-muted-foreground">Recover your account</p>
        </header>
        <main>
            <ForgotPasswordForm />
        </main>
        <footer className="text-center p-4 mt-8 text-sm text-muted-foreground">
            © 2024 CANARA BANK.
        </footer>
      </div>
    </div>
  );
}
