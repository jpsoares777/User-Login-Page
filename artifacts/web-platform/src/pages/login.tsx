import { useState } from "react";
import logoImg from "@assets/ChatGPT_Image_17_de_abr._de_2026,_20_49_18_(2)_1776469795366.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0c1d38" }}
    >
      {/* Ambient glow blobs — full page */}
      <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,150,255,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="fixed -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(57,227,124,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,80,200,0.06) 0%, transparent 60%)", filter: "blur(60px)" }} />

      {/* Subtle grid — full page */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      {/* Ghost bar chart — bottom right */}
      <div className="fixed bottom-0 right-0 pointer-events-none" style={{ opacity: 0.07 }}>
        <svg width="420" height="260" viewBox="0 0 420 260" fill="none">
          <defs>
            <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39e37c" stopOpacity="1" />
              <stop offset="100%" stopColor="#39e37c" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00aaff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00aaff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Bars */}
          <rect x="30"  y="160" width="32" height="100" rx="4" fill="url(#bar2)" />
          <rect x="80"  y="110" width="32" height="150" rx="4" fill="url(#bar1)" />
          <rect x="130" y="80"  width="32" height="180" rx="4" fill="url(#bar2)" />
          <rect x="180" y="50"  width="32" height="210" rx="4" fill="url(#bar1)" />
          <rect x="230" y="30"  width="32" height="230" rx="4" fill="url(#bar2)" />
          <rect x="280" y="60"  width="32" height="200" rx="4" fill="url(#bar1)" />
          <rect x="330" y="40"  width="32" height="220" rx="4" fill="url(#bar2)" />
          <rect x="380" y="20"  width="32" height="240" rx="4" fill="url(#bar1)" />
          {/* Baseline */}
          <line x1="20" y1="258" x2="420" y2="258" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Ghost line chart — top left */}
      <div className="fixed top-0 left-0 pointer-events-none" style={{ opacity: 0.06 }}>
        <svg width="480" height="220" viewBox="0 0 480 220" fill="none">
          <defs>
            <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00aaff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00aaff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineArea2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39e37c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#39e37c" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d="M0,160 C40,140 80,100 120,90 C160,80 200,110 240,80 C280,50 320,60 360,40 C400,20 440,30 480,10 L480,220 L0,220 Z"
            fill="url(#lineArea)"
          />
          {/* Line */}
          <path
            d="M0,160 C40,140 80,100 120,90 C160,80 200,110 240,80 C280,50 320,60 360,40 C400,20 440,30 480,10"
            stroke="#00aaff" strokeWidth="2" fill="none"
          />
          {/* Second line */}
          <path
            d="M0,180 C40,170 80,150 120,130 C160,110 200,140 240,120 C280,100 320,115 360,90 C400,65 440,75 480,55"
            stroke="#39e37c" strokeWidth="1.5" fill="none" strokeDasharray="6 4"
          />
          {/* Dots on first line */}
          {[[120,90],[240,80],[360,40]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#00aaff" />
          ))}
        </svg>
      </div>

      {/* Ghost mini sparklines — right center */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-6" style={{ opacity: 0.06 }}>
        {[
          { d: "M0,20 L10,15 L20,18 L30,8 L40,12 L50,4 L60,9", color: "#39e37c" },
          { d: "M0,18 L10,14 L20,20 L30,10 L40,16 L50,6 L60,14", color: "#00aaff" },
          { d: "M0,22 L10,16 L20,19 L30,12 L40,15 L50,8 L60,5",  color: "#a78bfa" },
        ].map((s, i) => (
          <svg key={i} width="60" height="28" viewBox="0 0 60 28">
            <path d={s.d} stroke={s.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="60" cy={s.d.split(" ").pop()!.split(",")[1]} r="3" fill={s.color} />
          </svg>
        ))}
      </div>

      {/* Ghost donut / ring — center left */}
      <div className="fixed left-16 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: 0.05 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="64" fill="none" stroke="#00aaff" strokeWidth="18" strokeDasharray="240 160" strokeDashoffset="-20" />
          <circle cx="80" cy="80" r="64" fill="none" stroke="#39e37c" strokeWidth="18" strokeDasharray="120 280" strokeDashoffset="220" />
          <circle cx="80" cy="80" r="64" fill="none" stroke="#a78bfa" strokeWidth="18" strokeDasharray="60 340" strokeDashoffset="340" />
        </svg>
      </div>

      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <div className="hidden lg:flex w-[52%] flex-col items-center justify-between py-14 px-12 relative">

        {/* Logo — mix-blend-mode:screen remove fundo preto */}
        <div className="relative z-10 w-full flex justify-center">
          <img
            src={logoImg}
            alt="SystemPay"
            className="w-[28rem] object-contain select-none"
            style={{ mixBlendMode: "screen" }}
            draggable={false}
          />
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex flex-col items-center gap-5 w-full">
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-white/25 text-[10px] uppercase tracking-[0.25em]">Baixe o aplicativo</p>
            <a
              href="#"
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 fill-white opacity-60">
                <path d="M3.18 23.76c.33.18.7.24 1.06.18l11.62-11.62-2.83-2.83L3.18 23.76zm14.65-12.77-2.53-2.53 2.53-2.53c.7-.7.7-1.83 0-2.53-.7-.7-1.83-.7-2.53 0l-2.53 2.53-2.53-2.53c-.7-.7-1.83-.7-2.53 0-.7.7-.7 1.83 0 2.53l2.53 2.53-2.53 2.53c-.7.7-.7 1.83 0 2.53.7.7 1.83.7 2.53 0l2.53-2.53 2.53 2.53c.7.7 1.83.7 2.53 0 .7-.7.7-1.83 0-2.53zM4.24.06C3.88 0 3.51.06 3.18.24L13.03 10.1l2.83-2.83L4.24.06z" />
              </svg>
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest leading-none mb-0.5">Disponível no</p>
                <p className="text-white/75 text-sm font-semibold">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        <p className="absolute bottom-3 text-white/15 text-[10px]">
          © {new Date().getFullYear()} systempay.tech · All rights reserved
        </p>
      </div>


      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-14 py-12 relative z-10">
        <div className="w-full max-w-[360px]">

          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoImg} alt="SystemPay" className="w-48 object-contain" draggable={false} />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
            <p className="text-white/35 text-sm">Insira suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Usuário */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Usuário
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,198,255,0.5)";
                    e.currentTarget.style.background = "rgba(0,198,255,0.05)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,198,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,198,255,0.5)";
                    e.currentTarget.style.background = "rgba(0,198,255,0.05)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,198,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-white/25 hover:text-white/50 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Esqueceu senha */}
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <a href="#" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
                Esqueceu sua senha?
              </a>
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white uppercase tracking-widest transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-1"
              style={{
                background: "linear-gradient(135deg, #0078ff 0%, #0050c8 100%)",
                boxShadow: "0 8px 28px rgba(0,112,255,0.35)",
              }}
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-white/20 text-xs mt-10">
            © {new Date().getFullYear()} systempay.tech · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
