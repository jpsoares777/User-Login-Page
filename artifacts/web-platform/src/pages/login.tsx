import { useState } from "react";
import logoImg from "@assets/ChatGPT_Image_12_de_mar._de_2026,_23_47_11_1776469089971.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-between py-16 px-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 45%, #0f2850 100%)",
        }}
      >
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative glow orbs */}
        <div className="absolute top-16 right-10 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #00c6ff 0%, transparent 70%)" }} />
        <div className="absolute bottom-16 left-5 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #39e37c 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #0078ff 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <img
            src={logoImg}
            alt="SystemPay"
            className="w-64 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Center tagline */}
        <div className="relative z-10 text-center px-8">
          <h2 className="text-white/90 text-2xl font-light leading-relaxed mb-5">
            Conecte-se à sua plataforma com segurança e eficiência
          </h2>
          <div
            className="w-16 h-0.5 mx-auto mb-5"
            style={{ background: "linear-gradient(90deg, #39e37c, #00c6ff)" }}
          />
          <p className="text-white/45 text-sm font-light tracking-[0.2em] uppercase">
            systempay.tech
          </p>
        </div>

        {/* Download app area */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <p className="text-white/40 text-xs uppercase tracking-[0.25em]">Baixe o APP</p>
          <a
            href="#"
            className="flex items-center gap-3 border border-white/15 rounded-xl px-5 py-3 transition-all duration-200 hover:border-white/30 hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" style={{ fill: "url(#googleGrad)" }}>
              <defs>
                <linearGradient id="googleGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#39e37c" />
                  <stop offset="100%" stopColor="#00c6ff" />
                </linearGradient>
              </defs>
              <path d="M3.18 23.76c.33.18.7.24 1.06.18l11.62-11.62-2.83-2.83L3.18 23.76zm14.65-12.77-2.53-2.53 2.53-2.53c.7-.7.7-1.83 0-2.53-.7-.7-1.83-.7-2.53 0l-2.53 2.53-2.53-2.53c-.7-.7-1.83-.7-2.53 0-.7.7-.7 1.83 0 2.53l2.53 2.53-2.53 2.53c-.7.7-.7 1.83 0 2.53.7.7 1.83.7 2.53 0l2.53-2.53 2.53 2.53c.7.7 1.83.7 2.53 0 .7-.7.7-1.83 0-2.53zM4.24.06C3.88 0 3.51.06 3.18.24L13.03 10.1l2.83-2.83L4.24.06z" />
            </svg>
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-widest leading-none mb-0.5">Disponível no</p>
              <p className="text-white text-sm font-semibold leading-tight">Google Play</p>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 text-white/20 text-xs text-center w-full">
          © Copyright {new Date().getFullYear()} systempay.tech · All rights reserved
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 md:px-16 lg:px-20 py-16">

        {/* Mobile logo */}
        <div className="md:hidden mb-8 flex justify-center">
          <div className="bg-[#0d1f3c] rounded-2xl px-6 py-4">
            <img src={logoImg} alt="SystemPay" className="h-12 object-contain" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Logo for desktop */}
          <div className="hidden md:flex justify-center mb-10">
            <div className="bg-[#0d1f3c] rounded-2xl px-8 py-5 shadow-lg">
              <img src={logoImg} alt="SystemPay" className="h-14 object-contain" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo</h1>
          <p className="text-gray-500 text-sm mb-8">Faça login para acessar sua conta</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-blue-400 transition-all duration-200 bg-gray-50/50"
                  style={{ "--tw-ring-color": "rgba(0,198,255,0.25)" } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-blue-400 transition-all duration-200 bg-gray-50/50"
                  style={{ "--tw-ring-color": "rgba(0,198,255,0.25)" } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <a href="#" className="text-sm text-amber-600 hover:text-amber-700 transition-colors font-medium">
                Esqueceu sua senha?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] mt-2"
              style={{
                background: "linear-gradient(135deg, #0066cc 0%, #0047ab 50%, #003380 100%)",
              }}
            >
              ENTRAR
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-10">
            © Copyright {new Date().getFullYear()} systempay.tech · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
