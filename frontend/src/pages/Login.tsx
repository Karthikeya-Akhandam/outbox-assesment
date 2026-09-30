import { useAuth } from '../context/AuthContext';
import { Mail } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white relative overflow-hidden">
      {/* Background gradients for modern aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-10 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
        <div className="bg-blue-500/10 p-4 rounded-full mb-6 ring-1 ring-blue-500/30">
          <Mail className="w-10 h-10 text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          ReachInbox
        </h1>
        <p className="text-gray-400 mb-8 text-center text-sm">
          High-performance email scheduling and delivery at scale.
        </p>

        <button 
          onClick={login}
          className="w-full group relative flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all hover:bg-gray-100 active:scale-95"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google logo" />
          <span>Continue with Google</span>
          <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all" />
        </button>
      </div>
    </div>
  );
}
