import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-gray-900 relative overflow-hidden">
      <div className="z-10 bg-white border border-gray-200 p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-[400px] flex flex-col">
        <h1 className="text-[28px] font-bold mb-8 text-center text-gray-900">
          Login
        </h1>

        <button 
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-[#f3f4f6] text-gray-700 font-medium py-3 px-6 rounded-lg transition-all hover:bg-gray-200 mb-6"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google logo" />
          <span>Login with Google</span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm text-gray-400">or sign up through email</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <input 
            type="email" 
            placeholder="Email ID" 
            className="w-full bg-[#f3f4f6] text-gray-800 placeholder-gray-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]/50 transition-all"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-[#f3f4f6] text-gray-800 placeholder-gray-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]/50 transition-all"
          />
        </div>

        <button 
          onClick={login}
          className="w-full bg-[#22c55e] text-white font-medium py-3 px-6 rounded-lg transition-all hover:bg-[#16a34a] active:scale-[0.98]"
        >
          Login
        </button>
      </div>
    </div>
  );
}
