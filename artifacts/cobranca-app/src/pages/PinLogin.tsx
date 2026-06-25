import { useState, useRef, useEffect } from "react";
import { loginPorCodigo, setCobradorId, setRotaSessao, setSaldoInicial, submitSolicitacao } from "../lib/api";

const GRAD_TOP = "#2d4f6b";
const GRAD_MID = "#3A5F82";
const GRAD_BOT = "#4A6F8E";
const WHITE = "#ffffff";
const WHITE70 = "rgba(255,255,255,0.7)";
const WHITE40 = "rgba(255,255,255,0.4)";
const WHITE20 = "rgba(255,255,255,0.2)";
const WHITE10 = "rgba(255,255,255,0.10)";
const GRADIENT = `linear-gradient(180deg, ${GRAD_TOP} 0%, ${GRAD_MID} 55%, ${GRAD_BOT} 100%)`;

type Tela = "pin" | "primeiro_acesso" | "pendente" | "dispositivo_diferente";

function Logo() {
  return (
    <img
      src={import.meta.env.BASE_URL + "logo_pin.png"}
      alt="Logo"
      style={{ width: "78%", maxWidth: 360, height: "auto", objectFit: "contain" }}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function Footer() {
  return (
    <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 11, color: "#000000" }}>
        © 2026 System Pay · Todos os direitos reservados
      </p>
    </div>
  );
}

function Btn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", background: WHITE,
      color: GRAD_TOP, border: "none", borderRadius: 50,
      paddingTop: 12, paddingBottom: 12, fontSize: 15, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: "0 3px 6px rgba(0,0,0,0.12)", opacity: disabled ? 0.7 : 1,
    }}>{label}</button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontSize: 15, color: WHITE,
  padding: "11px 14px", background: WHITE10, border: `1px solid ${WHITE20}`,
  borderRadius: 10, outline: "none", WebkitTextFillColor: WHITE,
};

export function PinLogin({ onUnlock }: { onUnlock: (cobradorId: number) => void }) {
  const [tela, setTela] = useState<Tela>("pin");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tela === "pin") inputRef.current?.focus();
  }, [tela]);

  const triggerShake = (msg: string) => {
    setShake(true);
    setError(msg);
    setLoading(false);
    setTimeout(() => { setShake(false); inputRef.current?.focus(); }, 500);
  };

  const handleTentarLogin = async () => {
    const cod = codigo.trim();
    if (cod.length < 4) { setError("Digite seu código de acesso."); return; }
    setLoading(true); setError("");
    try {
      const sessao = await loginPorCodigo(cod);
      setCobradorId(sessao.id);
      setRotaSessao(sessao.rota, sessao.cobradorNome);
      setSaldoInicial(sessao.saldoInicial);
      onUnlock(sessao.id);
    } catch (err: unknown) {
      const e = err as Error & { status?: string };
      if (e.status === "pendente") { setTela("pendente"); setLoading(false); return; }
      if (e.status === "registro_necessario") { setTela("primeiro_acesso"); setLoading(false); return; }
      if (e.status === "dispositivo_diferente") { setTela("dispositivo_diferente"); setLoading(false); return; }
      triggerShake(e.message ?? "Código de acesso inválido");
    }
  };

  const handleRegistrar = async () => {
    if (!nome.trim()) { setError("Informe seu nome completo."); return; }
    const cod = codigo.trim();
    if (cod.length < 4) { setError("Informe o código de acesso."); return; }
    setLoading(true); setError("");
    try {
      await submitSolicitacao(cod, nome.trim());
      setTela("pendente");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Erro ao enviar. Tente novamente.");
    } finally { setLoading(false); }
  };

  const handleSolicitarTroca = async () => {
    if (!nome.trim()) { setError("Informe seu nome completo."); return; }
    setLoading(true); setError("");
    try {
      await submitSolicitacao(codigo.trim(), nome.trim());
      setTela("pendente");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Erro ao enviar. Tente novamente.");
    } finally { setLoading(false); }
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      minHeight: "100dvh", width: "100%", background: GRADIENT,
      fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative",
      display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none",
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", width: "100%", paddingBottom: 60,
      }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 60 }}>
          <Logo />
        </div>
        {children}
      </div>
      <Footer />
      <style>{`
        input { -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: ${WHITE40}; opacity: 1; }
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-12px)}
          40%{transform:translateX(12px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );

  /* ── TELA: PENDENTE ──────────────────────────────────────── */
  if (tela === "pendente") {
    return (
      <Wrapper>
        <div style={{ width: "min(80vw, 300px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: WHITE10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: WHITE }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: WHITE }}>
              Aguardando aprovação
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: WHITE70, lineHeight: 1.6 }}>
              Seu acesso está aguardando aprovação do administrador.
              Assim que for aprovado, você poderá entrar no aplicativo.
            </p>
          </div>
          <button onClick={() => { setTela("pin"); setCodigo(""); setNome(""); setError(""); }}
            style={{ background: "none", border: `1px solid ${WHITE40}`, color: WHITE70,
              fontSize: 13, cursor: "pointer", padding: "8px 20px", borderRadius: 50 }}>
            Voltar
          </button>
        </div>
      </Wrapper>
    );
  }

  /* ── TELA: DISPOSITIVO DIFERENTE ─────────────────────────── */
  if (tela === "dispositivo_diferente") {
    return (
      <Wrapper>
        <div style={{ width: "min(80vw, 300px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: "#fca5a5" }}>
              <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 21c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-4H7V4h10v14z"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: WHITE, textAlign: "center" }}>
            Dispositivo não autorizado
          </p>
          <p style={{ margin: 0, fontSize: 13, color: WHITE70, textAlign: "center", lineHeight: 1.6 }}>
            Este código já está vinculado a outro dispositivo.
            Para usar neste celular, informe seu nome e solicite a troca ao administrador.
          </p>

          <div style={{ width: "100%", marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="off"
              onChange={e => { setNome(e.target.value); setError(""); }}
              style={inputStyle}
            />
            {error && <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>{error}</p>}
            <Btn label={loading ? "Enviando..." : "Solicitar troca de dispositivo"} onClick={handleSolicitarTroca} disabled={loading} />
            <button onClick={() => { setTela("pin"); setCodigo(""); setNome(""); setError(""); }}
              style={{ background: "none", border: "none", color: WHITE70, fontSize: 13,
                textDecoration: "underline", cursor: "pointer", padding: 0 }}>
              Voltar
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  /* ── TELA: PRIMEIRO ACESSO ───────────────────────────────── */
  if (tela === "primeiro_acesso") {
    return (
      <Wrapper>
        <div style={{ width: "min(80vw, 300px)", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: WHITE, textAlign: "center" }}>
            Primeiro acesso
          </p>
          <p style={{ margin: 0, fontSize: 13, color: WHITE70, textAlign: "center", lineHeight: 1.5 }}>
            Preencha seus dados para solicitar acesso ao administrador.
          </p>

          <input
            type="text"
            placeholder="Nome do cobrador"
            value={nome}
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect="off"
            onChange={e => { setNome(e.target.value); setError(""); }}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Código de acesso"
            value={codigo}
            autoComplete="off"
            onChange={e => { setCodigo(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleRegistrar(); }}
            style={inputStyle}
          />
          {error && <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>{error}</p>}
          <Btn label={loading ? "Enviando..." : "Solicitar acesso"} onClick={handleRegistrar} disabled={loading} />
          <button onClick={() => { setTela("pin"); setNome(""); setError(""); }}
            style={{ background: "none", border: "none", color: WHITE70, fontSize: 13,
              textDecoration: "underline", cursor: "pointer", padding: 0, textAlign: "center" }}>
            Voltar
          </button>
        </div>
      </Wrapper>
    );
  }

  /* ── TELA: PIN NORMAL ─────────────────────────────────────── */
  return (
    <Wrapper>
      <div style={{
        width: "min(48vw, 173px)", minWidth: 160, display: "flex",
        flexDirection: "column", alignItems: "center", gap: 12,
        animation: shake ? "shake 0.5s ease" : "none",
      }}>
        <div style={{ width: "100%" }}>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            value={codigo}
            onChange={e => { setCodigo(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleTentarLogin(); }}
            placeholder="•••••"
            style={{
              width: "100%", boxSizing: "border-box", fontSize: 22, fontWeight: 600,
              color: WHITE, textAlign: "center", letterSpacing: 10,
              paddingTop: 9, paddingBottom: 9, paddingLeft: 10, paddingRight: 10,
              background: WHITE10, border: "none", borderRadius: 10, outline: "none",
              caretColor: WHITE, WebkitTextFillColor: WHITE,
            }}
          />
          <div style={{ height: 2, background: WHITE20, marginTop: 2, borderRadius: 1 }} />
        </div>

        {error
          ? <p style={{ margin: 0, fontSize: 13, color: "#ffe0e0", textAlign: "center", minHeight: 18 }}>{error}</p>
          : <div style={{ height: 18 }} />
        }

        <Btn label={loading ? "..." : "Entrar"} onClick={handleTentarLogin} disabled={loading} />

        <button onClick={() => { setTela("primeiro_acesso"); setError(""); }}
          style={{ background: "none", border: "none", color: WHITE70, fontSize: 13,
            textDecoration: "underline", cursor: "pointer", padding: 0 }}>
          Primeiro acesso
        </button>

        <button onClick={() => { setCodigo(""); setError(""); inputRef.current?.focus(); }}
          style={{ background: "none", border: "none", color: WHITE40, fontSize: 12,
            cursor: "pointer", padding: 0 }}>
          Limpar
        </button>
      </div>
    </Wrapper>
  );
}
