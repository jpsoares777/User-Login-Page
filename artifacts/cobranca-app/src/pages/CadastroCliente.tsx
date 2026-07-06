import React, { useState, useEffect } from "react";
import {
  CheckCircle2, ChevronDown, Camera, FileText, Home,
  Plus, X, User, Banknote, MapPin, Paperclip, ImageIcon, ArrowLeft,
} from "lucide-react";

import { Emprestimo } from "./EmprestimosDoDia";
import { compressToBase64, saveFotoCliente, gerarConsecutivoUnico } from "../lib/storage";
import { getLimitesAprovacaoCache, fetchLimitesAprovacaoAPI } from "../lib/api";

const P_CC = { headerTop: "#3A5F82", headerBot: "#4A6F8E" };

function SectionHeader({ title, icon, color }: {
  title: string; icon: React.ReactNode;
  color: "blue" | "indigo" | "amber";
}) {
  const s = {
    blue:   { icon: "bg-blue-100 text-blue-500",   text: "text-blue-600" },
    indigo: { icon: "bg-indigo-100 text-indigo-500", text: "text-indigo-600" },
    amber:  { icon: "bg-amber-100 text-amber-500",  text: "text-amber-700" },
  }[color];
  return (
    <div className="flex items-center gap-1.5 mb-1 ml-0.5">
      <div className={`w-4 h-4 rounded-full ${s.icon} flex items-center justify-center`}>{icon}</div>
      <span className={`text-[10px] ${s.text} uppercase tracking-widest font-bold`}>{title}</span>
    </div>
  );
}

function Field({ label, required, type = "text", value, onChange, error }: {
  label: string; required?: boolean; type?: string;
  value?: string; onChange?: (v: string) => void; error?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide font-bold mb-0.5 ml-0.5" style={{ color: error ? "#ef4444" : "#4b5563" }}>
        {label}{required && <span className="ml-0.5" style={{ color: "#ef4444" }}>*</span>}
      </div>
      <input
        type={type}
        {...(value !== undefined
          ? { value, onChange: e => onChange?.(e.target.value) }
          : {}
        )}
        className="block w-full px-2 py-1.5 text-xs text-gray-900 rounded-md focus:outline-none focus:ring-1 transition-all"
        style={{
          background: error ? "#fff5f5" : "#f5f5f5",
          border: error ? "1.5px solid #ef4444" : "1px solid rgba(245,158,11,0.55)",
          boxShadow: error ? "0 0 0 2px rgba(239,68,68,0.1)" : "none",
        }}
      />
      {error && <p className="text-[9px] text-red-400 mt-0.5 ml-0.5">Campo obrigatório</p>}
    </div>
  );
}

function SelectField({ label, options, value, onChange }: {
  label: string; options: string[];
  value?: string; onChange?: (v: string) => void;
}) {
  const [local, setLocal] = useState("");
  const val = value !== undefined ? value : local;
  const handleChange = (v: string) => {
    if (onChange) onChange(v);
    else setLocal(v);
  };
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide font-bold mb-0.5 ml-0.5" style={{ color: "#4b5563" }}>{label}</div>
      <div className="relative">
        <select value={val} onChange={e => handleChange(e.target.value)}
          className="w-full appearance-none px-2 py-1.5 text-xs text-gray-900 bg-[#f5f5f5] rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
          style={{ borderWidth: 1, borderColor: "rgba(245,158,11,0.55)" }}>
          <option value="">selecione</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export interface CadastroInicialData {
  nome?: string; sobrenome?: string;
  telefone?: string; cpf?: string;
  endereco?: string; cep?: string; numero?: string;
  bairro?: string; cidade?: string; uf?: string;
  valorEmprestado?: string; valorParcela?: string;
  juros?: string; parcelas?: string; frequencia?: string;
}

export function CadastroCliente({ onBack, onSalvar, initialData }: {
  onBack: () => void;
  onSalvar?: (emp: Emprestimo) => void;
  initialData?: CadastroInicialData;
}) {
  const [pagamentoAdiantado, setPagamentoAdiantado] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [docFiles, setDocFiles] = useState<(File | null)[]>([null, null, null]);
  const [salvo, setSalvo] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Máximo de parcelas permitido ao criar/renovar um empréstimo (config global do admin).
  const [maxParcelasNovo, setMaxParcelasNovo] = useState(() => getLimitesAprovacaoCache().maxParcelasNovo);
  useEffect(() => { fetchLimitesAprovacaoAPI().then(l => setMaxParcelasNovo(l.maxParcelasNovo)).catch(() => {}); }, []);
  // Garante que o valor selecionado nunca ultrapasse o máximo (limite tardio via fetch ou dados de renovação).
  useEffect(() => {
    if (maxParcelasNovo > 0) {
      setLoanForm(f => (parseInt(f.parcelas) > maxParcelasNovo ? { ...f, parcelas: String(maxParcelasNovo) } : f));
    }
  }, [maxParcelasNovo]);

  const [submitted, setSubmitted] = useState(false);
  const [cpfField, setCpfField] = useState(initialData?.cpf ?? "");
  const [telefoneField, setTelefoneField] = useState(initialData?.telefone ?? "");
  const [cepField, setCepField] = useState(initialData?.cep ?? "");
  const [enderecoField, setEnderecoField] = useState(initialData?.endereco ?? "");
  const [numeroField, setNumeroField] = useState(initialData?.numero ?? "");
  const [bairroField, setBairroField] = useState(initialData?.bairro ?? "");
  const [cidadeField, setCidadeField] = useState(initialData?.cidade ?? "");
  const [ufField, setUfField] = useState(initialData?.uf ?? "");

  const [loanForm, setLoanForm] = useState({
    nome: initialData?.nome ?? "",
    sobrenome: initialData?.sobrenome ?? "",
    valorEmprestado: initialData?.valorEmprestado ?? "",
    valorParcela: initialData?.valorParcela ?? "",
    juros: initialData?.juros ?? "",
    parcelas: initialData?.parcelas ?? "1",
    frequencia: initialData?.frequencia ?? "Diário",
  });
  const setL = (k: keyof typeof loanForm) => (v: string) =>
    setLoanForm(f => ({ ...f, [k]: v }));

  const valorNum = parseFloat(loanForm.valorEmprestado) || 0;
  const jurosNum = parseFloat(loanForm.juros) || 0;
  const parcelasNum = parseInt(loanForm.parcelas) || 1;
  const totalComJuros = valorNum * (1 + jurosNum / 100);
  const parcelaCalculada = parcelasNum > 0 && valorNum > 0 ? totalComJuros / parcelasNum : 0;

  useEffect(() => {
    if (valorNum > 0 && jurosNum >= 0 && parcelasNum > 0) {
      setLoanForm(f => ({ ...f, valorParcela: parcelaCalculada.toFixed(2) }));
    }
  }, [loanForm.valorEmprestado, loanForm.juros, loanForm.parcelas]);

  const docs = [
    { label: "Identidade (frente)", icon: <FileText size={11} /> },
    { label: "Identidade (verso)",  icon: <FileText size={11} /> },
    { label: "Comprovante de Residência", icon: <Home size={11} /> },
  ];

  const handleFileChange = (index: number, file: File | null) => {
    setDocFiles(prev => { const n = [...prev]; n[index] = file; return n; });
  };

  const resetForm = () => {
    setPagamentoAdiantado(false);
    setIsDocsOpen(false);
    setDocFiles([null, null, null]);
    setSubmitted(false);
    setCpfField(""); setTelefoneField("");
    setCepField(""); setEnderecoField(""); setNumeroField("");
    setBairroField(""); setCidadeField(""); setUfField("");
    setLoanForm({ nome: "", sobrenome: "", valorEmprestado: "", valorParcela: "", juros: "", parcelas: "1", frequencia: "Diário" });
    setFormKey(k => k + 1);
  };

  const isValid = () =>
    cpfField.trim() && telefoneField.trim() && loanForm.nome.trim() &&
    cepField.trim() && enderecoField.trim() && numeroField.trim() &&
    bairroField.trim() && cidadeField.trim() && ufField.trim() &&
    loanForm.valorEmprestado.trim() && loanForm.valorParcela.trim() && loanForm.juros.trim();

  const handleSalvar = async () => {
    setSubmitted(true);
    if (!isValid()) return;
    setSalvo(true);
    setShowConfirmacao(true);

    const clienteId = Date.now();
    const consecutivo = gerarConsecutivoUnico();

    const fotosParaSalvar: { id: number; nome: string; base64: string }[] = [];
    const docLabels = [
      "Identidade (frente)",
      "Identidade (verso)",
      "Comprovante de Residência",
    ];
    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      if (file) {
        try {
          const base64 = await compressToBase64(file);
          fotosParaSalvar.push({ id: clienteId + i + 1, nome: docLabels[i], base64 });
        } catch {}
      }
    }
    saveFotoCliente(clienteId, fotosParaSalvar);

    if (onSalvar) {
      onSalvar({
        id: clienteId,
        consecutivo,
        nomeCliente: [loanForm.nome, loanForm.sobrenome].filter(Boolean).join(" ").toUpperCase() || "CLIENTE",
        diario: loanForm.frequencia === "Diário",
        frequencia: loanForm.frequencia,
        criadoEm: new Date().toISOString(),
        valorEmprestado: parseFloat(loanForm.valorEmprestado) || 0,
        valorParcela: parseFloat(loanForm.valorParcela) || 0,
        taxaJuros: parseFloat(loanForm.juros) || 0,
        quantidadeParcelas: parseInt(loanForm.parcelas) || 1,
        pagamentoAdiantado,
        telefone: telefoneField,
        cpf: cpfField,
        endereco: enderecoField,
        cep: cepField,
        numero: numeroField,
        bairro: bairroField,
        cidade: cidadeField,
        uf: ufField,
      });
    }

    setTimeout(() => {
      setSalvo(false);
      setShowConfirmacao(false);
      resetForm();
    }, 1500);
  };

  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto",
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      position: "relative", overflow: "hidden",
      backgroundColor: "#F0F0F0",
    }}>

      {/* Cabeçalho (apenas em modo renovação) */}
      {initialData && (
        <div style={{
          background: `linear-gradient(160deg, ${P_CC.headerTop} 0%, ${P_CC.headerBot} 100%)`,
          padding: "16px 16px 14px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.3)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 42, height: 42,
                background: "linear-gradient(145deg, #B91C1C, #EF4444)",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(185,28,28,0.5)",
                border: "1.5px solid rgba(255,255,255,0.15)",
              }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>MN</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Renovação</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Sistema de Cobrança</div>
              </div>
            </div>
            <button onClick={onBack} style={{
              width: 36, height: 36, background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              cursor: "pointer", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowLeft size={18} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      {showConfirmacao && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3 mx-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <polyline points="4,12 9,17 20,7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-800">Empréstimo Salvo!</p>
            <p className="text-[11px] text-gray-400 text-center">Registro criado com sucesso.</p>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        <div key={formKey} className="px-3 pt-3 space-y-3">

          {/* DADOS DO CLIENTE */}
          <section>
            <SectionHeader title="DADOS DO CLIENTE" icon={<User size={10} />} color="blue" />
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 overflow-hidden">
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1"><Field label="CPF" required value={cpfField} onChange={setCpfField} error={submitted && !cpfField.trim()} /></div>
                  <div className="flex-1"><Field label="Telefone" required type="tel" value={telefoneField} onChange={setTelefoneField} error={submitted && !telefoneField.trim()} /></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Field label="Nome" required value={loanForm.nome} onChange={setL("nome")} error={submitted && !loanForm.nome.trim()} />
                  </div>
                  <div className="flex-1">
                    <Field label="Sobrenome" value={loanForm.sobrenome} onChange={setL("sobrenome")} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ENDEREÇO */}
          <section>
            <SectionHeader title="ENDEREÇO" icon={<MapPin size={10} />} color="indigo" />
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-500 overflow-hidden">
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="w-24"><Field label="CEP" required value={cepField} onChange={setCepField} error={submitted && !cepField.trim()} /></div>
                  <div className="flex-1"><Field label="Rua / Avenida" required value={enderecoField} onChange={setEnderecoField} error={submitted && !enderecoField.trim()} /></div>
                  <div className="w-16"><Field label="Nº" required value={numeroField} onChange={setNumeroField} error={submitted && !numeroField.trim()} /></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1"><Field label="Bairro" required value={bairroField} onChange={setBairroField} error={submitted && !bairroField.trim()} /></div>
                  <div className="flex-1"><Field label="Cidade" required value={cidadeField} onChange={setCidadeField} error={submitted && !cidadeField.trim()} /></div>
                  <div className="w-12"><Field label="UF" required value={ufField} onChange={setUfField} error={submitted && !ufField.trim()} /></div>
                </div>
              </div>
            </div>
          </section>

          {/* DOCUMENTOS (OPCIONAL) */}
          <section>
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-400 overflow-hidden">
              <button onClick={() => setIsDocsOpen(!isDocsOpen)}
                className="w-full flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                    <Camera size={9} className="text-purple-500" />
                  </div>
                  <span className="text-[10px] text-purple-600 uppercase tracking-widest font-bold">Documentos</span>
                  <span className="text-[9px] text-gray-400">(opcional)</span>
                </div>
                {isDocsOpen ? <X size={12} className="text-gray-400" /> : <Plus size={12} className="text-purple-400" />}
              </button>
              <div className={`transition-all duration-300 overflow-hidden ${isDocsOpen ? "max-h-48" : "max-h-0"}`}>
                <div className="border-t border-gray-100 px-3 py-2 space-y-1.5">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                        <span className="text-purple-400 shrink-0">{doc.icon}</span>
                        <div className="min-w-0">
                          <span className="text-[10px] text-gray-600 block leading-tight truncate max-w-[150px]">{doc.label}</span>
                          {docFiles[i] && <span className="text-[9px] text-green-600 font-medium">✓ {docFiles[i]!.name}</span>}
                        </div>
                      </div>
                      <label className={`flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 cursor-pointer ${
                        docFiles[i] ? "bg-green-50 border border-green-300" : "bg-purple-50 border border-purple-200"}`}>
                        <input type="file" accept="image/*,application/pdf" className="hidden"
                          onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)} />
                        {docFiles[i]
                          ? <><ImageIcon size={9} className="text-green-500" /><span className="text-[9px] text-green-600">trocar</span></>
                          : <><Paperclip size={9} className="text-purple-400" /><span className="text-[9px] text-purple-500">anexar</span></>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DETALHES DO EMPRÉSTIMO */}
          <section>
            <SectionHeader title="DETALHES DO EMPRÉSTIMO" icon={<Banknote size={10} />} color="amber" />
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-amber-400 overflow-hidden">
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Field label="Valor do Empréstimo" required type="number"
                      value={loanForm.valorEmprestado} onChange={setL("valorEmprestado")}
                      error={submitted && !loanForm.valorEmprestado.trim()} />
                  </div>
                  <div className="flex-1">
                    <Field label="Valor da Parcela" required type="number"
                      value={loanForm.valorParcela} onChange={setL("valorParcela")}
                      error={submitted && !loanForm.valorParcela.trim()} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectField label="Nº de Parcelas"
                      options={Array.from({ length: Math.max(1, maxParcelasNovo) }, (_, i) => String(i + 1))}
                      value={loanForm.parcelas} onChange={setL("parcelas")} />
                  </div>
                  <div className="flex-1">
                    <Field label="Juros (%)" required type="number"
                      value={loanForm.juros} onChange={setL("juros")}
                      error={submitted && !loanForm.juros.trim()} />
                  </div>
                  <div className="flex-1">
                    <SelectField label="Frequência"
                      options={["Diário","Semanal","Quinzenal","Mensal"]}
                      value={loanForm.frequencia} onChange={setL("frequencia")} />
                  </div>
                </div>

                {/* Checkbox + Salvar */}
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setPagamentoAdiantado(!pagamentoAdiantado)}>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all ${
                      pagamentoAdiantado ? "bg-green-500" : "bg-white border-2 border-gray-300"}`}>
                      {pagamentoAdiantado && <CheckCircle2 size={9} className="text-white" />}
                    </div>
                    <span className="text-[10px] text-gray-500 select-none">Pagamento adiantado</span>
                  </label>

                  <button onClick={handleSalvar}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-[0.97] text-white ${
                      salvo ? "bg-green-500" : "bg-green-600 hover:bg-green-700"}`}
                    style={{ boxShadow: "0 2px 5px rgba(22,163,74,0.3)" }}>
                    <CheckCircle2 size={10} />
                    {salvo ? "Salvo!" : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
