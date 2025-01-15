# Projeto de PMS 24/25

Este projeto consiste numa plataforma web de crowdfunding, projetada para incentivar doações a causas sociais. O objetivo é criar uma experiência envolvente que fomente a participação comunitária e aumente o impacto das campanhas. Algumas das funcionalidades incluem a criação e gestão de campanhas, visualização de doações e criação de utilizadores. 

## Pré-requisitos
- Node.js
- Node Package Manager (NPM)
- Git

## Instalação

O processo de instalação consiste em clonar este repositório e instalar as dependências utilizando o NPM. Para tal podem ser executados os seguintes comandos:

```
git clone https://github.com/LeJoneMacarone/Projeto-PMS
npm install
```

## Execução

A platforma pode ser executada localmente executando o seguinte comando num terminal:

```
node index.js
```

## Utilização

Enquanto a aplicação estiver a correr, o acesso pode ser feito num web-browser pelo URL [`http:/localhost:3000/campaigns`](http:/localhost:3000/campaigns).

Algumas das funcionalidades podem exigir login na plataforma. Para tal é necessária o registo (para criar uma conta) e o posterior login. Importante notar que o registo de criadores de campanha só fica finalizado após a validação de um administrador.

Alternativamente, este repositório fornece um ficheiro `sqlite` com alguns dados de exemplo para teste de funcionalidades durante as fases de desenvolvimento, incluindo um conjunto de contas de utilizadores. 

Na tabela seguinte estão listadas algumas das contas que podem ser utilizadas para testar as funcionalidades. Cada conta está associado a um cargo específico, que podem assumir.

| Username | Password | Cargo |
| - | - | - |
| root | root | Administrador "Root"
| frank | password | Administrador
| thor | password | Criador de Campanhas
| bob | password | Doador  

## Testes

O `package.json` define alguns comandos que podem ser usados de modo a executar os testes unitários e gerar relatórios de coverage.

| Comando | Descrição |
| :-: | :- |
| `npm run test` | Executa os testes unitários. |
| `npm run test-coverage` | Executa os testes e gera o respetivo relatório de coverage localizado em `./coverage/lcov-report/index.html`|