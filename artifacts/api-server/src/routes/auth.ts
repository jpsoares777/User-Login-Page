import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, usuariosTable } from "@workspace/db";

const router: IRouter = Router();

// Hash de senha com scrypt (salt aleatório embutido no formato salt:hash).
const hashSenha = (senha: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verificaSenha = (senha: string, senhaHash: string): boolean => {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash) return false;
  const calc = scryptSync(senha, salt, 64);
  const stored = Buffer.from(hash, "hex");
  return calc.length === stored.length && timingSafeEqual(calc, stored);
};

// Garante o usuário admin padrão (admin / admin123) na primeira utilização.
const garanteAdmin = async () => {
  const [admin] = await db.select().from(usuariosTable).where(eq(usuariosTable.nome, "admin"));
  if (admin) return admin;
  const [criado] = await db.insert(usuariosTable).values({
    nome: "admin",
    email: "admin@systempay.local",
    senhaHash: hashSenha("admin123"),
    papel: "admin",
  }).returning();
  return criado;
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const { usuario, senha } = req.body ?? {};
  if (!usuario || !senha) { res.status(400).json({ error: "usuario e senha são obrigatórios" }); return; }

  const admin = await garanteAdmin();
  const [user] = await db.select().from(usuariosTable).where(eq(usuariosTable.nome, String(usuario)));
  const alvo = user ?? (String(usuario) === "admin" ? admin : null);

  if (!alvo || !alvo.ativo || !verificaSenha(String(senha), alvo.senhaHash)) {
    res.status(401).json({ error: "Usuário ou senha incorretos" });
    return;
  }
  res.json({ ok: true, usuario: alvo.nome });
});

router.post("/auth/alterar-senha", async (req, res): Promise<void> => {
  const { usuario, senhaAtual, senhaNova } = req.body ?? {};
  if (!usuario || !senhaAtual || !senhaNova) {
    res.status(400).json({ error: "usuario, senhaAtual e senhaNova são obrigatórios" });
    return;
  }
  if (String(senhaNova).length < 6) {
    res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    return;
  }

  await garanteAdmin();
  const [user] = await db.select().from(usuariosTable).where(eq(usuariosTable.nome, String(usuario)));
  if (!user || !user.ativo) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  if (!verificaSenha(String(senhaAtual), user.senhaHash)) {
    res.status(401).json({ error: "Senha atual incorreta" });
    return;
  }

  await db.update(usuariosTable)
    .set({ senhaHash: hashSenha(String(senhaNova)) })
    .where(eq(usuariosTable.id, user.id));

  res.json({ ok: true });
});

export default router;
