import { useState } from "react";

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
          background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #e94560 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0f3460 0%, transparent 70%)" }} />

        {/* Logo area */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-2 border-red-600/40 bg-white/5 flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-white/40 text-xs text-center px-4 leading-tight">
              Sua logo<br />aparece aqui
            </span>
          </div>
          <p className="text-red-500/80 uppercase tracking-[0.3em] text-xs font-semibold mt-2">
            Plataforma de Gestão
          </p>
        </div>

        {/* Center tagline */}
        <div className="relative z-10 text-center px-8">
          <h2 className="text-white/90 text-2xl font-light leading-relaxed mb-4">
            Conecte-se à sua plataforma com segurança e eficiência
          </h2>
          <div className="w-16 h-0.5 bg-red-500 mx-auto mb-4" />
          <p className="text-white/50 text-sm font-light tracking-wide">
            SOLUÇÕES TECNOLÓGICAS INTELIGENTES
          </p>
        </div>

        {/* Download app area */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <p className="text-white/50 text-xs uppercase tracking-widest">Baixe o APP</p>
          <a
            href="#"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-5 py-2.5 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M3.18 23.76c.33.18.7.24 1.06.18l11.62-11.62-2.83-2.83L3.18 23.76zm14.65-12.77-2.53-2.53 2.53-2.53c.7-.7.7-1.83 0-2.53-.7-.7-1.83-.7-2.53 0l-2.53 2.53-2.53-2.53c-.7-.7-1.83-.7-2.53 0-.7.7-.7 1.83 0 2.53l2.53 2.53-2.53 2.53c-.7.7-.7 1.83 0 2.53.7.7 1.83.7 2.53 0l2.53-2.53 2.53 2.53c.7.7 1.83.7 2.53 0 .7-.7.7-1.83 0-2.53zM4.24.06C3.88 0 3.51.06 3.18.24L13.03 10.1l2.83-2.83L4.24.06z" />
            </svg>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest leading-none">Disponível no</p>
              <p className="text-white text-sm font-medium leading-tight">Google Play</p>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 text-white/25 text-xs text-center w-full">
          © Copyright {new Date().getFullYear()} · All rights reserved
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 md:px-16 lg:px-24 py-16">
        {/* Mobile logo (only visible on mobile) */}
        <div className="md:hidden mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center mb-3">
            <span className="text-gray-400 text-xs text-center px-2 leading-tight">Logo</span>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Logo placeholder for desktop */}
          <div className="hidden md:flex justify-center mb-10">
            <div className="w-24 h-24 rounded-full border-2 border-gray-100 bg-gray-50 shadow-sm flex items-center justify-center">
              <span className="text-gray-400 text-[10px] text-center leading-tight px-2">Sua logo<br />aqui</span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Bem-vindo</h1>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 bg-gray-50/50"
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
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 bg-gray-50/50"
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
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99] mt-2"
              style={{
                background: "linear-gradient(135deg, #1a4fc4 0%, #1e3a8a 100%)",
              }}
            >
              ENTRAR
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-10">
            © Copyright {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
