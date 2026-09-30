# QINEX Crypto

Landing page em **Next.js (App Router), React e TypeScript**, com fundo preto, reflexos em azul/ciano/violeta e a logo fornecida pelo cliente.

## Executar

Use Node.js 24 e pnpm 11.25.0, como no ambiente de produção.

```sh
pnpm install
pnpm dev
```

Abra o endereço local informado pelo Next.js.

## Verificar e compilar

```sh
pnpm typecheck
pnpm build
```

A configuração `output: "export"` gera o site estático na pasta `out/`, com a estrutura fonte preservada em Next.js. A saída pode ser publicada em um servidor de arquivos estáticos. `next start` não é usado para servir uma exportação estática.

## Publicação

- Site: [qinexbeta.vercel.app](https://qinexbeta.vercel.app).
- Repositório: [jvrsconsultoria-afk/qinex](https://github.com/jvrsconsultoria-afk/qinex).
- Vercel: projeto `qinexbeta`, equipe `Qnx` (`qnx1`).

O arquivo `vercel.json` compila o projeto Next.js com `pnpm build` e publica a exportação estática da pasta `out`. As credenciais e os arquivos locais da Vercel ficam fora do Git.

## Experiência da landing page

Os links de cotação levam ao simulador na própria página. Os atalhos de compra e venda no hero selecionam a operação correspondente. A tela de solicitação, o envio para WhatsApp e a cópia de mensagens foram removidos. A dashboard e o backend serão desenvolvidos separadamente.

## Estrutura

- `src/app/layout.tsx`: idioma, metadados, fonte e tema.
- `src/app/page.tsx`: página inicial.
- `src/components/landing-page.tsx`: seções, menu móvel e simulador de cotação.
- `src/app/globals.css`: estilo, responsividade e redução de movimento.
- `public/images/qinex-logo.png`: imagem original fornecida.
- `public/favicon.svg`: favicon da marca.

## Conteúdo

Inclui apresentação, simulador de compra e venda, três etapas, explicação do USDT, perguntas frequentes e chamada para simular uma cotação. A página não envia solicitações de operação.

O contato comercial, as condições operacionais, as redes atendidas e os dados cadastrais da empresa devem ser preenchidos/validados pelo proprietário antes de divulgação pública.

Referências de conteúdo: [documentação oficial da Tether](https://tether.to/en/why-tether/) e [documentação do Next.js](https://nextjs.org/docs/app/getting-started/installation).

## Cotação

Os campos começam vazios, sem sugestões de valor. Na compra do cliente, a entrada é em BRL e o recebimento em USDT. Na venda, a entrada é em USDT e o recebimento em BRL.

A referência USDT/BRL vem da API pública da Coinbase e é atualizada a cada 60 segundos. Não são enviados à Coinbase os valores preenchidos pelo visitante. Se a fonte não responder, a calculadora informa a indisponibilidade e não substitui o preço por um valor fictício. A variável opcional `NEXT_PUBLIC_USDT_BRL_RATE` permite informar um spot fixo em reais.

Regra confirmada pelo proprietário, do ponto de vista da QINEX:

- QINEX compra USDT por `spot - R$ 0,01`.
- QINEX vende USDT por `spot + R$ 0,02`.

Na interface do cliente, portanto:

- Comprar: `USDT recebido = BRL informado / (spot + 0,02)`.
- Vender: `BRL recebido = USDT informado * (spot - 0,01)`.

O ajuste da cotação já está incluído no cálculo. A seção de taxas mostra o spot, o ajuste e o preço aplicado. Custos de rede permanecem a confirmar, pois nenhum valor foi fornecido. Valores estimados em USDT são truncados a seis casas decimais; recebimentos em BRL, a duas.

Exemplo confirmado: com spot de R$ 5,00, a compra da QINEX ocorre a R$ 4,99 e a venda a R$ 5,02. Assim, um cliente que informa R$ 502 para comprar recebe uma estimativa de 100 USDT; um cliente que vende 100 USDT recebe uma estimativa de R$ 499, antes de eventuais custos de rede.

Fonte: [API de taxas de câmbio da Coinbase](https://docs.cdp.coinbase.com/coinbase-business/track-apis/exchange-rates).
