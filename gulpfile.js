'use strict'

let gulp = require('gulp')
let jshint = require('gulp-jshint')
let stylish = require('jshint-stylish')
let execSpawn = require('child_process').spawn
let execSync = require('child_process').execSync
let config = require('config')
let logger = require('./lib/logger')

let server
let watchScripts = [
    '*.js',
    'db/**/*.js',
    'lib/**/*.js',
    'routes/**/*.js'
]

let lambdaContext = {
    // Using by aws-serverless-express package
    succeed: v => {
        logger.info(JSON.stringify(v, null, '  '))
        process.exit(0)
    }
}
let lambdaCallback = (err, result) => {
    let status = 0

    if (err) {
        logger.error(err)
        status = 1
    }

    if (result) {
        logger.info(result)
    }

    process.exit(status)
}

gulp.task('env-localhost', function() {
    process.env.NODE_ENV = 'localhost'
});

gulp.task('env-development', function() {
    process.env.LAUNCH_MODE = 'listen';
    process.env.NODE_ENV = 'development'
});

gulp.task('lint', () => {
    gulp.src(watchScripts)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
});

gulp.task('server', ['env-development'], () => {
    if (server) {
         server.kill('SIGKILL')
    }

    server = execSpawn('node', ['app.js'])
    server.stdout.setEncoding('utf8')
    server.stdout.on('data', data => {
        logger.info(data)
    })

    server.stderr.setEncoding('utf8')
    server.stderr.on('data', data => {
        logger.info(data)
    })
})

gulp.task('watch', ['env-development', 'lint', 'server'], () => {
    gulp.watch(watchScripts, ['lint', 'server'])
})

gulp.task('local-api-receiver', ['env-localhost', 'lint'], () => {
    require('./bin/lambda-api-receiver.js').handler(
        require('./bin/fixtures/api-gateway-event.json'),
        lambdaContext,
        lambdaCallback
    )
})

gulp.task('local-heartrate-checker', ['env-localhost', 'lint'], () => {
    require('./bin/lambda-heartrate-checker.js').handler(
        {},
        lambdaContext,
        lambdaCallback
    )
})

gulp.task('invoke-lambda-api-receiver', () => {
    logger.info(execSync(`aws lambda invoke --function-name DokiDokiWatchApiReceiver --region ${config.setup.region} --payload file://bin/fixtures/api-gateway-event.json tmp/lambda-invoke-response.json && cat tmp/lambda-invoke-response.json`).toString())
})

gulp.task('invoke-lambda-heartrate-checker', () => {
    logger.info(execSync(`aws lambda invoke --function-name DokiDokiWatchHeartrateChecker --region ${config.setup.region} tmp/lambda-invoke-response.json && cat tmp/lambda-invoke-response.json`).toString())
})

gulp.task('create-bucket', () => {
    logger.info(execSync(`aws s3 mb s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('delete-bucket', () => {
    logger.info(execSync(`aws s3 rm s3://${config.setup.bucket_name}/lambda-function.zip --region ${config.setup.region}; aws s3 rm s3://${config.setup.bucket_name}/cloudformation/simple-proxy-api.yaml --region ${config.setup.region}; aws s3 rb s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('upload-api-gateway-swagger', () => {
    logger.info(execSync(`aws s3 cp ./config/cloudformation/simple-proxy-api.yaml s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('create-stack', () => {
    logger.info(execSync(`aws cloudformation create-stack --stack-name ${config.setup.cloud_formation_stack_name} --template-body file://./config/cloudformation/cloudformation.json --capabilities CAPABILITY_IAM --parameters ParameterKey=DokiDokiWatchS3Bucket,ParameterValue=${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('update-stack', () => {
    logger.info(execSync(`aws cloudformation update-stack --stack-name ${config.setup.cloud_formation_stack_name} --template-body file://./config/cloudformation/cloudformation.json --capabilities CAPABILITY_IAM --parameters ParameterKey=DokiDokiWatchS3Bucket,ParameterValue=${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('delete-stack', () => {
    logger.info(execSync(`aws cloudformation delete-stack --stack-name ${config.setup.cloud_formation_stack_name} --region ${config.setup.region}`).toString())
})

gulp.task('package-function', () => {
    logger.info(execSync(`zip -q -r tmp/lambda-function.zip .sequelizerc app.js bin/lambda-api-receiver.js bin/lambda-heartrate-checker.js config lib node_modules public routes views`).toString())
})

gulp.task('upload-function', () => {
    logger.info(execSync(`aws s3 cp ./tmp/lambda-function.zip s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('update-function', () => {
    logger.info(execSync(`aws lambda update-function-code --function-name DokiDokiWatchApiReceiver --region ${config.setup.region} --zip-file fileb://tmp/lambda-function.zip`).toString())
    logger.info(execSync(`aws lambda update-function-code --function-name DokiDokiWatchHeartrateChecker --region ${config.setup.region} --zip-file fileb://tmp/lambda-function.zip`).toString())
})

gulp.task('package-upload-function', () => {
    logger.info(execSync(`npm run package-function && npm run upload-function`).toString())
})

gulp.task('upload-update-function', () => {
    logger.info(execSync(`npm run upload-function && npm run update-function`).toString())
})

gulp.task('package-upload-update-function', () => {
    logger.info(execSync(`npm run package-upload-function && npm run update-function`).toString())
})

gulp.task('setup', () => {
    logger.info(execSync(`npm install && (aws s3api get-bucket-location --bucket ${config.setup.bucket_name} --region ${config.setup.region} || npm run create-bucket) && npm run package-upload-function && npm run upload-api-gateway-swagger && npm run create-stack`).toString())
})
