# dokidoki watch

This application is a heart rate measurement tool using [Fitbit](https://www.fitbit.com/).
If the threshold is exceeded, the application will notify the LINE talk room.

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

* `dokidoki_watch-data` container
  * Alpine base
  * Persistent data container for application

## Local setup

```
$ docker-compose build
$ docker-compose up
$ npm run sequelize db:migrate

# Starting Express
$ npm run watch
```

Open the [http://localhost:3000/](http://localhost:3000/) in your browser.
In API console, you can try the Fitbit API.

<img src="https://raw.githubusercontent.com/wiki/naomichi-y/dokidoki_watch/images/api_console.png" width="600px">

## Deploy to AWS

Deploy flow is same as aws-serverless-express.

### Setup
Creating stack on AWS CloudFormation.

```
$ mysql -u {USER} -p -h {HOST} -e "CREATE DATABASE {DATABASE}"
$ npm run sequelize -- --env production db:migrate

$ npm run config <accountId> <bucketName> [region]
$ npm run setup
```

Unfortunately, CloudFormation does not support scheduled Lambda events.
Trigger must be set manually.

1. Open `DokiDokiWatchHeartrateChecker` function on the Lambda console.
2. Open the `Triggers` tab.
3. Open the `Triggers` tab and click `Add triger`.
4. Set trigger properties.
  * Trigger type: CloudWatch Events - Schedule
  * Schedule expression: rate(5 minutes)
  * Enable trigger: Check

This completes the setting.
After that, data is saved in RDS at the timing when Fitbit synchronizes.

### Updating Lambda function
```
$ npm run package-upload-update-function
```

### Deleting stack on CloudFormation

```
$ npm run delete-stack
```
