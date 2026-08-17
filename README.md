# TechNova Store — protótipo funcional

Abra `index.html` para a loja e `admin.html` para o painel administrativo.

## Fluxo incluído
- Visual inspirado no layout enviado: fundo escuro, azul elétrico, cabeçalho, navegação e cards.
- Produtos com estrelas, quantidade de avaliações e vendidos.
- Carrinho, quantidades, remoção e cupons.
- Tela de checkout com endereço, garantia de 6/12 meses, mensagem ao vendedor, envio, pagamento e totais.
- QR Code PIX demonstrativo.
- Conta do cliente com nome no topo, menu "Minha conta / Minhas compras / Sair".
- Área de conta com dados, imagem, cartões/contas, endereços e troca de senha.
- Notificações do cliente.
- Pedidos e rastreio/rota após envio.
- Painel Admin separado com estoque, pedidos, status, notificações e ações para aprovar pagamento, separar e enviar.
- Sincronização entre abas via `localStorage`.

## Importante
Este é um protótipo front-end. Não há servidor, banco de dados, autenticação real ou cobrança PIX/cartão real. Para colocar em produção, conecte o front-end a uma API/backend, banco de dados, gateway de pagamento, autenticação e serviço de rastreio.

## Banner inicial
O banner `assets/banner-inicio.png` é a imagem enviada pelo usuário e aparece no início da loja, logo abaixo da navegação.

## Compra pelo WhatsApp
Após preencher a conta e clicar em **Entrar e comprar**, o cliente é redirecionado para o WhatsApp da TechNova (`+55 92 99310-4032`) com uma mensagem automática contendo o nome do produto.


## Fluxo Comprar agora
O botão **Comprar agora** redireciona diretamente ao WhatsApp da TechNova, sem abrir carrinho, checkout, endereço, CEP, rua ou complemento. A mensagem é personalizada automaticamente com o nome do produto.


## Painel administrativo completo
- Dashboard com notificações de pedidos.
- Gerenciamento de banner com upload, prévia, salvar e remover.
- Produtos e estoque.
- Pedidos e aprovação.
- Cupons editáveis: código, porcentagem/valor, desconto, uso máximo, validade, valor mínimo, primeira compra, exclusivo e limite por cliente.
- Cupom expirado é identificado automaticamente.
- O banner salvo pelo Admin é aplicado no início da loja no mesmo navegador.

## Carrinho / checkout
A base do projeto inclui suporte para quantidade, remoção, cupom, frete, garantia, endereço, resumo, PIX e total. O fluxo **Comprar agora** continua configurado para redirecionar diretamente ao WhatsApp conforme solicitado anteriormente.


## CRUD de produtos
O painel Admin agora permite **criar, editar e excluir produtos**, incluindo nome, preços, estoque, avaliações, vendidos, desconto, descrição, emoji e imagem. Os produtos gerenciados ficam disponíveis na loja no mesmo navegador.


## Redes sociais
No final da loja foi adicionado o bloco **SIGA-NOS** com YouTube, Discord e Instagram. Discord aponta para o convite informado e Instagram para `technova_store0`.


## Ajustes visuais
Banner configurado para exibição em **1000 × 267 px**. Os ícones do Discord e Instagram agora usam os logotipos em SVG.


## Marketing
Adicionadas as seções: Ofertas do dia, Mais vendidos, Lançamentos, Produtos gamer, Tecnologia, Produtos mais avaliados, Compre junto e economize, Ofertas com contador e Produtos exclusivos TechNova. O contador funciona no navegador e reinicia após terminar.


**Banner principal:** 1366 × 267 px.


## Contas
Cliente: **Entrar** com e-mail e senha ou **Criar conta** com nome, sobrenome, data de nascimento, telefone, e-mail e senha. Admin: o proprietário é **zadaxxgb@gmail.com**, com senha inicial **TechNova@2026!**; somente ele pode adicionar/excluir administradores.

> Esta é uma implementação front-end/local. Para produção real, autenticação, senhas e permissões devem ficar em um servidor com banco de dados.


## Versão PostgreSQL + Render

Esta versão adiciona uma API Node.js/Express em `backend/` e uma tabela PostgreSQL para os produtos.
O painel administrativo grava/cria/edita/exclui produtos no banco online. A loja consulta `/api/products`,
então o mesmo produto pode aparecer no PC, celular e outros navegadores.

### 1. Criar o PostgreSQL
No Render, crie um PostgreSQL e copie a `Internal Database URL` (ou a URL disponibilizada pelo Render).

### 2. Publicar a API
Crie um Web Service no Render apontando para a pasta `backend` do projeto.
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable: `DATABASE_URL` = URL do PostgreSQL
- `NODE_ENV` = `production`

A API cria a tabela `products` automaticamente na primeira inicialização.

### 3. Ligar o GitHub Pages à API
Depois que o Web Service estiver online, copie a URL dele, por exemplo:
`https://technova-api-exemplo.onrender.com`

Abra `config.js` e altere:
`window.TECHNOVA_API_URL = "http://localhost:3001/api";`
para:
`window.TECHNOVA_API_URL = "https://technova-api-exemplo.onrender.com/api";`

Faça commit/push novamente no GitHub. O GitHub Pages continuará hospedando o site, mas os produtos serão buscados no PostgreSQL por meio da API.

### 4. Teste
Abra o painel Admin, crie um produto e depois abra a loja em outro celular/navegador.
O produto deverá aparecer nos dois, porque agora os dispositivos consultam o mesmo PostgreSQL.

### Observação de segurança
O código atual preserva a autenticação administrativa local do protótipo. Para produção completa, a autenticação de administradores/clientes, pedidos, cupons, banners e pagamentos também deve migrar para a API/banco, em vez de ficar no `localStorage`.
