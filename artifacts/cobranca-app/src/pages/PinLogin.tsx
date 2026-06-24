import { useState, useRef, useEffect } from "react";
import { fetchCobradores, type CobradorAPI, setCobradorId } from "../lib/api";

const PIN_CORRETO = "10600";
const GRAD_TOP = "#2d4f6b";
const GRAD_MID = "#3A5F82";
const GRAD_BOT = "#4A6F8E";
const WHITE = "#ffffff";
const WHITE70 = "rgba(255,255,255,0.7)";
const WHITE40 = "rgba(255,255,255,0.4)";
const WHITE20 = "rgba(255,255,255,0.2)";
const WHITE10 = "rgba(255,255,255,0.10)";

const GRADIENT = `linear-gradient(180deg, ${GRAD_TOP} 0%, ${GRAD_MID} 55%, ${GRAD_BOT} 100%)`;

function Footer() {
  return (
    <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 11, color: "#000000" }}>
        © 2026 System Pay · Todos os direitos reservados
      </p>
    </div>
  );
}

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

export function PinLogin({ onUnlock }: { onUnlock: (cobradorId: number) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [etapa, setEtapa] = useState<"pin" | "cobrador">("pin");
  const [cobradores, setCobradores] = useState<CobradorAPI[]>([]);
  const [cobradorSelecionado, setCobradorSelecionado] = useState<number | null>(null);
  const [carregandoCob, setCarregandoCob] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (etapa === "pin") inputRef.current?.focus();
  }, [etapa]);

  const handleLogin = () => {
    if (pin.length < 5) { setError("PIN deve ter 5 dígitos."); return; }
    setLoading(true);
    setTimeout(async () => {
      if (pin === PIN_CORRETO) {
        setLoading(false);
        setCarregandoCob(true);
        const lista = await fetchCobradores();
        setCobradores(lista);
        setCarregandoCob(false);
        if (lista.length === 1) {
          setCobradorId(lista[0].id);
          onUnlock(lista[0].id);
        } else {
          setEtapa("cobrador");
        }
      } else {
        setShake(true);
        setPin("");
        setError("PIN incorreto. Tente novamente.");
        setLoading(false);
        setTimeout(() => {
          setShake(false);
          inputRef.current?.focus();
        }, 500);
      }
    }, 120);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleConfirmarCobrador = () => {
    if (!cobradorSelecionado) return;
    setCobradorId(cobradorSelecionado);
    onUnlock(cobradorSelecionado);
  };

  /* ── ETAPA: SELEÇÃO DE COBRADOR ────────────────────────────── */
  if (etapa === "cobrador") {
    return (
      <div style={{
        minHeight: "100dvh",
        width: "100%",
        background: GRADIENT,
        fontFamily: "'Inter','Segoe UI',sans-serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          paddingBottom: 60,
          gap: 32,
        }}>
          <Logo />

          <div style={{ width: "min(80vw, 300px)", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: WHITE, textAlign: "center" }}>
              Quem está cobrando hoje?
            </p>

            {carregandoCob ? (
              <p style={{ margin: 0, fontSize: 13, color: WHITE70, textAlign: "center" }}>Carregando...</p>
            ) : cobradores.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: WHITE70, textAlign: "center" }}>
                  Sem cobradores cadastrados na plataforma.
                </p>
                <button
                  onClick={() => onUnlock(0)}
                  style={{
                    width: "100%",
                    background: WHITE,
                    color: GRAD_TOP,
                    border: "none",
                    borderRadius: 50,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Entrar sem cobrador
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cobradores.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCobradorSelecionado(c.id)}
                    style={{
                      width: "100%",
                      background: cobradorSelecionado === c.id ? WHITE : WHITE10,
                      color: cobradorSelecionado === c.id ? GRAD_TOP : WHITE,
                      border: `2px solid ${cobradorSelecionado === c.id ? WHITE : WHITE20}`,
                      borderRadius: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    {c.nome}
                    {c.rota && (
                      <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, opacity: 0.7 }}>
                        — Rota {c.rota}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleConfirmarCobrador}
                  disabled={!cobradorSelecionado}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    background: cobradorSelecionado ? WHITE : WHITE40,
                    color: GRAD_TOP,
                    border: "none",
                    borderRadius: 50,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: cobradorSelecionado ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                  }}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── TELA DE LOGIN ───────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100dvh",
      width: "100%",
      background: GRADIENT,
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      userSelect: "none",
    }}>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingBottom: 60,
      }}>
        {/* Logo */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 80 }}>
          <Logo />
        </div>

        {/* Seção do PIN */}
        <div style={{
          width: "min(48vw, 173px)",
          minWidth: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          animation: shake ? "shake 0.5s ease" : "none",
        }}>
          {/* Campo de PIN */}
          <div style={{ width: "100%" }}>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={pin}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
                setPin(v);
                setError("");
              }}
              onKeyDown={handleKey}
              placeholder="•••••"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 22,
                fontWeight: 600,
                color: WHITE,
                textAlign: "center",
                letterSpacing: 10,
                paddingTop: 9,
                paddingBottom: 9,
                paddingLeft: 10,
                paddingRight: 10,
                background: WHITE10,
                border: "none",
                borderRadius: 10,
                outline: "none",
                caretColor: WHITE,
                WebkitTextFillColor: WHITE,
              }}
            />
            <div style={{ height: 2, background: WHITE20, marginTop: 2, borderRadius: 1 }} />
          </div>

          {/* Erro ou espaçador */}
          {error ? (
            <p style={{ margin: 0, fontSize: 13, color: "#ffe0e0", textAlign: "center", minHeight: 18 }}>
              {error}
            </p>
          ) : (
            <div style={{ height: 18 }} />
          )}

          {/* Botão Entrar */}
          <button
            onClick={handleLogin}
            disabled={loading || carregandoCob}
            style={{
              width: "100%",
              background: WHITE,
              color: GRAD_TOP,
              border: "none",
              borderRadius: 50,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 3px 6px rgba(0,0,0,0.12)",
              transition: "opacity 0.15s",
              opacity: loading || carregandoCob ? 0.8 : 1,
            }}
          >
            {loading || carregandoCob ? "..." : "Entrar"}
          </button>

          {/* Link Redefinir PIN */}
          <button
            onClick={() => { setPin(""); setError(""); inputRef.current?.focus(); }}
            style={{
              background: "none",
              border: "none",
              color: WHITE70,
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Redefinir PIN
          </button>
        </div>
      </div>

      <Footer />

      <style>{`
        input::placeholder { color: ${WHITE40}; opacity: 1; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(12px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
