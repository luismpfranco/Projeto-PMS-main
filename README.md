# PMS Project

We got a grade of 18/20. Developed by a group of four people.

Graded by Pedro Campos @ University of Madeira


Description

This project consists of a web-based crowdfunding platform designed to encourage donations to social causes. The goal is to create an engaging experience that encourages community participation and increases the impact of campaigns. Some of the features include creating and managing campaigns, viewing donations, and creating users.

## Prerequisites
- Node.js
- Node Package Manager (NPM)
- Git

## Instalation

The installation process consists of cloning this repository and installing the dependencies using NPM. To do this, the following commands can be executed:

```
git clone https://github.com/luismpfranco/Software-Processes-and-Metrics-Project
npm install
```

## Execution

The platform can be run locally by running the following command in a terminal:

```
node index.js
```

## Use

While the application is running, access can be made in a web browser via the URL [`http:/localhost:3000/campaigns`](http:/localhost:3000/campaigns).

Some features may require login to the platform. To do this, you need to register (to create an account) and then log in. It is important to note that the registration of campaign creators is only completed after validation by an administrator.

Alternatively, this repository provides an `sqlite` file with some sample data for functionality testing during the development stages, including a set of user accounts.

The following table lists some of the accounts that can be used to test the features. Each account is associated with a specific role that they can assume.

| Username | Password | Position |
| - | - | - |
| root | root | Administrator "Root"
| frank | password | Administrator
| thor | password | Campaigns creator
| bob | password | Donor

## Tests

The `package.json` file defines some commands that can be used to run unit tests and generate coverage reports.

| Command | Description |
| :-: | :- |
| `npm run test` | Runs the unit tests. |
| `npm run test-coverage` | Runs the tests and generates the respective coverage report located at `./coverage/lcov-report/index.html`|
