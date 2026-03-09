# Gilmar Dashboard — Setup Completo

Dashboard pessoal de disciplina e evolução diária.
Paleta Valedise · Frases Goggins + Escrituras · PWA instalável

---

## PASSO 1 — Supabase (banco de dados)

1. Acesse https://supabase.com e vá no seu projeto
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `supabase_setup.sql`
5. Clique em **RUN**
6. Vá em **Settings > API** e copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon public** key

---

## PASSO 2 — Configurar credenciais

Abra o arquivo `config.js` e substitua:

```js
const SUPABASE_URL  = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON = 'sua_anon_key_aqui';
```

---

## PASSO 3 — GitHub Pages

1. No GitHub Desktop, faça commit e push do repositório
2. No GitHub.com, vá no repositório > **Settings > Pages**
3. Em **Source**, selecione `Deploy from a branch`
4. Branch: `main` · Folder: `/ (root)`
5. Clique **Save**
6. Aguarde ~2 minutos e acesse: `https://SEU_USUARIO.github.io/REPOSITÓRIO`

---

## PASSO 4 — Instalar no celular (Android)

1. Abra o Chrome no Android
2. Acesse a URL do GitHub Pages
3. Clique nos 3 pontinhos (menu)
4. Selecione **"Adicionar à tela inicial"**
5. Confirme — o app aparece como ícone na tela inicial

**iPhone:** Safari > Botão compartilhar > "Adicionar à tela de início"

---

## ESTRUTURA DOS ARQUIVOS

```
gilmar-dashboard/
├── index.html          ← Estrutura HTML principal
├── style.css           ← Estilos (paleta Valedise)
├── app.js              ← Toda a lógica + Supabase
├── config.js           ← ⚠️ Suas credenciais (edite aqui)
├── manifest.json       ← Configuração PWA
├── sw.js               ← Service Worker (offline)
├── supabase_setup.sql  ← SQL para criar tabelas
└── README.md           ← Este arquivo
```

---

## COMO COMPARTILHAR EVOLUÇÃO COM CLAUDE

Quando quiser que o Claude analise sua evolução:

1. No Supabase > **Table Editor > daily_summary**
2. Exporte como CSV (botão de download)
3. Cole aqui no chat ou envie o arquivo

O Claude pode então:
- Ver sua eficiência diária ao longo das semanas
- Identificar padrões (quais dias você rende mais)
- Sugerir ajustes na rotina
- Adicionar novas features ao dashboard

---

## ATUALIZAÇÕES FUTURAS

Para atualizar o dashboard:
1. Faça as mudanças nos arquivos
2. GitHub Desktop > Commit > Push
3. GitHub Pages atualiza automaticamente em ~1 min

---

## NOTAS DE SEGURANÇA

- O `config.js` contém a `anon key` do Supabase
- A `anon key` é pública por design — não expõe dados sensíveis
- Se o repositório for público, tudo bem para uso pessoal
- Para maior segurança futura, use autenticação Supabase (pode ser adicionado depois)
