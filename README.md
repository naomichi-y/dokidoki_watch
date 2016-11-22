# dokidoki watch

This application is a heart rate measurement tool using [Fitbit](https://www.fitbit.com/).
Heart rate is analyzed using Fitbit API, and notification is sent to LINE talk room if threshold is exceeded.

<img src="https://raw.githubusercontent.com/wiki/naomichi-y/dokidoki_watch/images/line_notify.png" width="300px">

## Architecture
Applications are configured in a serverless architecture and work on AWS Lambda.

<img src="https://raw.githubusercontent.com/wiki/naomichi-y/dokidoki_watch/images/architecture.png" width="600px">

## Required tools

The development environment can be built with Docker.

* [Docker](https://docs.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* [AWS Command Line Interface](https://aws.amazon.com/cli/)

## Docker components
Docker consists of the following containers.

* `dokidoki_watch-app` container
  * Alpine base
  * NodeJS v4.3.2
    * [aws-serverless-express](https://github.com/awslabs/aws-serverless-express)

* `dokidoki_watch-db` container
  * MySQL v5.7

## Setup

### Create Fitbit application
Please open [dev.fitbit.com](https://dev.fitbit.com/) and create a new application.
`OAuth 2.0 Application Type` must be set to `Personal`.

### Create development environment

```
$ docker-compose build
$ docker-compose up

# For application settings, please edit `config/default.json` (or `development.json`, `production.json`).
$ npm run sequelize db:migrate
```

Open the [http://localhost:3000/](http://localhost:3000/) in your browser.
In API console, you can try the Fitbit API.

<img src="https://raw.githubusercontent.com/wiki/naomichi-y/dokidoki_watch/images/api_console.png" width="600px">

If you want to start Express without going through Docker, please execute the following command.

```
$ npm run watch
```

## Deploy to AWS

Deploy flow is same as `aws-serverless-express` package.

### Initial setup
Create a stack with CloudFormation.

```
$ mysql -u {USER} -p -h {HOST} -e "CREATE DATABASE {DATABASE}"
$ npm run sequelize -- --env production db:migrate

$ npm run config <accountId> <bucketName> [region]
$ npm run setup
```

#### Lambda trigger settings
Unfortunately, CloudFormation does not support scheduled Lambda events.
Trigger must be set manually.

1. Open `DokiDokiWatchHeartrateChecker` function on Lambda console.
2. Open the `Triggers` tab.
3. Open the `Triggers` tab and click `Add triger`.
4. Set trigger properties.
  * Trigger type: CloudWatch Events - Schedule
  * Schedule expression: rate(5 minutes)
  * Enable trigger: Check

This completes the setting.

#### Lambda VPC settings
Also, in order to connect to MySQL from Lambda, we strongly recommend VPC setting of Lambda function (VPC setting is not done in above setup)

#### Create database
You need to create a database first. Please match name specified in `config/database.json`.

### Test drive

Please synchronize Fitbit. If application is set up correctly, you can check the execution result on CloudWatch Logs.

## Updating Lambda function
```
$ npm run package-upload-update-function
```

## Deleting stack on CloudFormation

```
$ npm run delete-stack
```
