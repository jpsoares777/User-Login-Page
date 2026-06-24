import { useState } from "react";
import { ListaClientes } from "@/pages/ListaClientes";
import { PinLogin } from "@/pages/PinLogin";

function App() {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [cobradorId, setCobradorId] = useState<number | null>(null);

  const handleUnlock = (cobId: number) => {
    setCobradorId(cobId);
    setDesbloqueado(true);
  };

  const handleSair = () => {
    setDesbloqueado(false);
    setCobradorId(null);
  };

  if (!desbloqueado) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "#000",
      }}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <PinLogin onUnlock={handleUnlock} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      justifyContent: "center",
      background: "#f0f0f0",
    }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#fff" }}>
        <ListaClientes onSair={handleSair} cobradorId={cobradorId ?? 0} />
      </div>
    </div>
  );
}

export default App;
