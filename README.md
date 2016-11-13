# dokidoki watch

This application is a heart rate measurement tool using [Fitbit](https://www.fitbit.com/).
If the threshold is exceeded, the application will notify the LINE talk room.

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

* dokidoki_watch-app
  * NodeJS v4.3.2
    * [aws-serverless-express](https://github.com/awslabs/aws-serverless-express)

* dokidoki_watch-db
  * MySQL v5.7

* dokidoki_watch-data
  * Persistent data container for application

## Local setup

```
docker-compose build
docker-compose up
npm run sequelize db:migrate

# Starting Express
npm run watch
```

Open the [http://localhost:3000/](http://localhost:3000/) in your browser.

## Deploy to AWS

Deploy flow is same as aws-serverless-express.

### Setup
Creating stack on AWS CloudFormation.

```
npm run config <accountId> <bucketName> [region]
npm run setup
```

### Updating Lambda function
```
npm run package-upload-update-function
```

### Deleting stack on CloudFormation

```
npm run delete-stack
```
