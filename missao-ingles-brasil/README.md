# Missão Inglês Brasil 🇬🇧

Protótipo web de uma plataforma gamificada de aprendizado de inglês: onboarding, teste de nível, mapa de fases, exercícios de vários tipos, boss battle, conquistas, missões diárias, vocabulário e perfil — tudo salvo no navegador (localStorage), sem backend.

Este guia foi escrito para quem tem pouca experiência com programação. Siga os passos na ordem.

---

## 1. O que é este projeto

- **100% front-end**: HTML, CSS e JavaScript puro (sem React, sem servidor, sem instalação de pacotes).
- **Progresso salvo localmente** no seu navegador (localStorage) — fecha o navegador e o progresso continua lá.
- Feito para rodar tanto no **celular** quanto no **computador**.

## 2. Estrutura de pastas

```
missao-ingles-brasil/
│
├── index.html          ← página principal (abra este arquivo / sirva esta pasta)
├── README.md            ← este arquivo
│
├── css/
│   └── style.css        ← todo o visual do app (cores, telas, botões, cards...)
│
└── js/
    ├── data.js           ← conteúdo pedagógico (vocabulário, mundos, fases, teste de nível, conquistas)
    ├── engine.js          ← regras do jogo (XP, moedas, desbloqueio de fases, estrelas, progresso)
    └── app.js             ← interface: monta as telas e conecta tudo (data.js + engine.js) na tela
```

A ordem de carregamento dos scripts em `index.html` é sempre:
`data.js` → `engine.js` → `app.js` (nessa ordem, porque cada um depende do anterior).

## 3. Requisitos

- Um navegador atualizado (Chrome, Edge, Firefox ou Safari).
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado, mas não obrigatório).
- Conexão com a internet **apenas** para carregar as fontes do Google Fonts (o app funciona normalmente sem internet — as fontes usam um substituto padrão automaticamente).

## 4. Como abrir o projeto no VS Code

1. Baixe/copie a pasta `missao-ingles-brasil` inteira para o seu computador (com as subpastas `css/` e `js/` dentro dela).
2. Abra o **VS Code**.
3. Vá em **File → Open Folder...** (Arquivo → Abrir Pasta...) e selecione a pasta `missao-ingles-brasil`.
4. Confirme no painel lateral (Explorer) que a estrutura está assim:
   ```
   missao-ingles-brasil/
     index.html
     README.md
     css/style.css
     js/data.js
     js/engine.js
     js/app.js
   ```

## 5. Como executar

Você tem duas opções. A **Opção A** é a mais simples; a **Opção B** é recomendada porque evita pequenos problemas de cache do navegador.

### Opção A — Abrir direto no navegador (mais simples)

1. No VS Code, clique com o botão direito em `index.html`.
2. Escolha **"Reveal in File Explorer"** (ou "Copy Path") e depois dê duplo clique no arquivo `index.html` no seu explorador de arquivos.
3. O navegador vai abrir o app automaticamente.

### Opção B — Usando a extensão Live Server (recomendado)

1. No VS Code, clique no ícone de **Extensões** na barra lateral esquerda (ícone de quadrados).
2. Pesquise por **"Live Server"** (autor: Ritwick Dey) e clique em **Install**.
3. Depois de instalado, volte ao arquivo `index.html`, clique com o botão direito nele e escolha **"Open with Live Server"**.
4. Seu navegador padrão vai abrir automaticamente em um endereço como `http://127.0.0.1:5500`, já mostrando o app.

Pronto — o app já está rodando! Qualquer alteração que você fizer nos arquivos e salvar (Ctrl+S) atualiza a página automaticamente quando estiver usando o Live Server.

## 6. Fluxo do aplicativo

1. **Splash** — tela de abertura rápida enquanto os dados carregam.
2. **Onboarding** — boas-vindas, escolha de interesses e de tempo diário de estudo.
3. **Teste de nível** — 45 perguntas (fácil, intermediário e difícil) para descobrir seu nível (A1 a C1).
4. **Home** — seu painel: XP, moedas, streak, missão em destaque, missões diárias e progresso de habilidades.
5. **Mapa** — os mundos e fases disponíveis, com fases bloqueadas/disponíveis/concluídas e a Boss Battle.
6. **Fase → Exercícios** — múltipla escolha, tradução, complete a lacuna, escolha por imagem, montar frase e leitura.
7. **Resultado da fase** — estrelas, XP e moedas conquistados.
8. **Boss (First Conversation)** — um diálogo interativo no fim do Mundo 1.
9. **Vocabulário, Conquistas e Perfil** — acessíveis pela barra inferior a qualquer momento.

## 7. Como resetar o progresso

Dentro do app: vá em **Perfil → REINICIAR PROGRESSO** e confirme. Isso apaga o usuário salvo no localStorage e volta para a tela de onboarding.

Se preferir fazer isso manualmente pelo navegador:
1. Abra as Ferramentas do Desenvolvedor (F12).
2. Vá na aba **Application** (ou **Armazenamento**) → **Local Storage** → selecione o endereço do site.
3. Apague a chave `mib_user_v1`.
4. Atualize a página.

## 8. Adicionando novo conteúdo

Para adicionar mundos, fases, palavras de vocabulário, perguntas do teste de nível ou conquistas, edite **apenas** `js/data.js` — a interface (`app.js`) e a lógica (`engine.js`) já sabem ler qualquer fase nova que sigam o mesmo formato das existentes (mesmos campos: `id`, `title`, `exercises`, `unlockRequirements`, etc.).

## 9. Changelog — correções de bugs (revisão de qualidade)

Esta revisão manteve 100% da funcionalidade e do conteúdo originais — nenhuma tela, texto pedagógico ou regra de pontuação foi alterada. Foram corrigidos os seguintes bugs:

1. **"Não foi possível carregar o aplicativo" / `js/engine.js` não carrega (bug crítico — causa raiz do erro relatado).** Em navegadores, quando várias tags `<script src="...">` "clássicas" (sem `type="module"`) são carregadas na mesma página, todas compartilham o **mesmo escopo de topo** para declarações `const`/`let`. `js/data.js` declarava `const CONFIG`, `const WORLDS`, `const VOCABULARY` etc. no nível mais alto do arquivo, e `js/engine.js` fazia `const { CONFIG, WORLDS, ... } = window.MIB_DATA;` — também no nível mais alto, com os **mesmos nomes**. Isso gera um `SyntaxError: Identifier 'CONFIG' has already been declared` assim que o navegador tenta interpretar `engine.js`, impedindo esse arquivo (e por consequência `app.js`) de rodar — daí a tela de erro. Esse bug já existia no código original (confirmado antes desta correção) e não aparece em testes simples via Node.js, só reproduzindo o comportamento real de múltiplos `<script>` no mesmo documento. Corrigido isolando `js/data.js` e `js/engine.js`, cada um, dentro de uma IIFE (função autoexecutável) própria — o mesmo padrão que `js/app.js` já usava — para que as declarações internas de cada arquivo fiquem em escopos totalmente separados.
2. **Missões diárias reiniciando a cada fase concluída (bug crítico).** Em `js/engine.js`, o campo `dailyQuestDate` nunca era salvo de volta no usuário depois da primeira vez. Resultado: a partir do segundo dia de uso, **toda vez que uma fase era concluída**, o app achava que as missões estavam "desatualizadas" e as recriava do zero — o progresso das missões diárias nunca acumulava de verdade. Agora a data é persistida corretamente a cada atualização, e as missões só são recriadas uma vez por dia, como deveriam.
3. **Modal de "fase bloqueada" fechava ao clicar em qualquer lugar do seu conteúdo.** Em `js/app.js`, um clique em qualquer texto dentro do modal (não só fora dele) borbulhava até o fundo escurecido e fechava o modal sem querer. Corrigido para fechar apenas ao clicar fora do modal ou no botão "ENTENDI".
4. **Exercícios de "montar frase" continuavam editáveis depois de corrigidos.** Diferente dos outros tipos de exercício (que travam a resposta após confirmar), era possível continuar reordenando as palavras da frase depois de já ver o resultado. Agora a interação é bloqueada assim que a resposta é conferida, igual aos demais tipos.
5. **`loadUser()` mais resiliente a dados salvos incompletos/corrompidos.** Se o `localStorage` tivesse um formato inesperado (ex: de uma versão futura do app, ou corrompido), campos como `stars`, `vocabularyMastery` ou `dailyQuests` podiam quebrar a renderização de telas. Agora cada campo é validado individualmente e usa um valor padrão seguro quando necessário — inclusive com merge profundo de `skillProgress`, para não perder habilidades existentes caso novas sejam adicionadas no futuro.
6. **Pequena proteção defensiva em `getWorldProgress`** contra um capítulo sem a lista `levels`, evitando um possível erro de execução.
7. **Diagnóstico automático de erro de carregamento.** Se algum script ainda assim falhar (arquivo ausente, bloqueado, etc.), a própria tela de erro agora mostra qual arquivo faltou e, quando disponível, o motivo técnico exato — sem precisar abrir o Console do navegador.
8. **Melhorias visuais leves** (`css/style.css`): cursor correto em botões desabilitados e opções de resposta erradas/neutras ficam visivelmente esmaecidas após responder, deixando a resposta correta mais fácil de identificar.

## 10. Notas técnicas e decisões de implementação

- Nenhum dado ou lógica pedagógica dos arquivos originais (`cod 1.js`, `cod 2.js`, `cod 3.css`) foi removido ou reescrito — eles foram apenas renomeados/movidos para `js/data.js`, `js/engine.js` e `css/style.css`.
- O único conteúdo **adicionado** ao `data.js`/`engine.js` originais foi zero — nenhuma alteração de conteúdo ou lógica foi necessária, pois os dados e regras já cobriam tudo que a interface precisava.
- O `css/style.css` recebeu um pequeno bloco **adicional** ao final (busca/filtros do Vocabulário e Mapa, cabeçalho de detalhe da fase, tela de erro e contornos de foco de teclado para acessibilidade) seguindo exatamente as mesmas variáveis e padrões visuais já definidos no arquivo original.
- O campo `name` do usuário (usado na Home e no Perfil) é coletado na primeira tela do onboarding — os arquivos originais não definiam uma tela específica para isso, então foi adicionado um campo opcional de nome na tela de boas-vindas (usa "Guest" se deixado em branco).
- A pronúncia das palavras na tela de Vocabulário usa a Web Speech API do navegador (`speechSynthesis`), nativa e sem dependências externas. Se o navegador não suportar, um aviso discreto é mostrado.
