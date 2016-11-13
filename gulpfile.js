'use strict'

let gulp = require('gulp')
let jshint = require('gulp-jshint')
let stylish = require('jshint-stylish')
let execSpawn = require('child_process').spawn
let execSync = require('child_process').execSync
let config = require('config')

let server
let watchScripts = [
    '*.js',
    'db/**/*.js',
    'lib/**/*.js',
    'routes/**/*.js'
]

let lambdaContext = {
    succeed: v => {
        console.log(v)
        process.exit(0)
    }
}
let lambdaCallback = (err, result) => {
    let status = 0

    if (err) {
        console.error(err)
        status = 1
    }

    if (result) {
        console.log(result)
    }

    process.exit(status)
}

gulp.task('set-dev-env', function() {
    process.env.EXPRESS_MODE = 'listen';
    process.env.NODE_ENV = 'development'
});

gulp.task('lint', () => {
    gulp.src(watchScripts)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
});

gulp.task('server', ['set-dev-env'], () => {
    if (server) {
         server.kill('SIGKILL')
    }

    server = execSpawn('node', ['app.js'])
    server.stdout.setEncoding('utf8')
    server.stdout.on('data', data => {
        console.log(data)
    })

    server.stderr.setEncoding('utf8')
    server.stderr.on('data', data => {
        console.log(data)
    })
})

gulp.task('watch', ['set-dev-env', 'lint', 'server'], () => {
    gulp.watch(watchScripts, ['lint', 'server'])
})

gulp.task('local', () => {
    require('./bin/lambda.js').handler(
        require('./bin/fixtures/api-gateway-event.json'),
        lambdaContext,
        lambdaCallback
    )
})

gulp.task('local-heartrate', () => {
    require('./bin/lambda-heartrate.js').handler(
        {},
        lambdaContext,
        lambdaCallback
    )
})

gulp.task('invoke-lambda', () => {
    console.log(execSync(`aws lambda invoke --function-name DokiDokiWatch --region ${config.setup.region} --payload file://bin/fixtures/api-gateway-event.json tmp/lambda-invoke-response.json && cat tmp/lambda-invoke-response.json`).toString())
})

gulp.task('create-bucket', () => {
    console.log(execSync(`aws s3 mb s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('delete-bucket', () => {
    console.log(execSync(`aws s3 rm s3://${config.setup.bucket_name}/lambda-function.zip --region ${config.setup.region}; aws s3 rm s3://${config.setup.bucket_name}/cloudformation/simple-proxy-api.yaml --region ${config.setup.region}; aws s3 rb s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('upload-api-gateway-swagger', () => {
    console.log(execSync(`aws s3 cp ./config/cloudformation/simple-proxy-api.yaml s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('create-stack', () => {
    console.log(execSync(`aws cloudformation create-stack --stack-name ${config.setup.cloud_formation_stack_name} --template-body file://./config/cloudformation/cloudformation.json --capabilities CAPABILITY_IAM --parameters ParameterKey=DokiDokiWatchS3Bucket,ParameterValue=${config.setup.bucket_name} --region ${config.setup.region}`))
})

gulp.task('update-stack', () => {
    console.log(execSync(`aws cloudformation update-stack --stack-name ${config.setup.cloud_formation_stack_name} --template-body file://./config/cloudformation/cloudformation.json --capabilities CAPABILITY_IAM --parameters ParameterKey=DokiDokiWatchS3Bucket,ParameterValue=${config.setup.bucket_name} --region ${config.setup.region}`))
})

gulp.task('delete-stack', () => {
    console.log(execSync(`aws cloudformation delete-stack --stack-name ${config.setup.cloud_formation_stack_name} --region ${config.setup.region}`).toString())
})

gulp.task('package-function', () => {
    console.log(execSync(`zip -q -r tmp/lambda-function.zip .sequelizerc app.js bin/lambda.js bin/lambda-heartrate.js config lib node_modules public routes views`).toString())
})

gulp.task('upload-function', () => {
    console.log(execSync(`aws s3 cp ./tmp/lambda-function.zip s3://${config.setup.bucket_name} --region ${config.setup.region}`).toString())
})

gulp.task('update-function', () => {
    console.log(execSync(`aws lambda update-function-code --function-name DokiDokiWatch --region ${config.setup.region} --zip-file fileb://tmp/lambda-function.zip`).toString())
})

gulp.task('package-upload-function', () => {
    console.log(execSync(`npm run package-function && npm run upload-function`).toString())
})

gulp.task('upload-update-function', () => {
    console.log(execSync(`npm run upload-function && npm run update-function`).toString())
})

gulp.task('package-upload-update-function', () => {
    console.log(execSync(`npm run package-upload-function && npm run update-function`))
})

gulp.task('setup', () => {
    console.log(execSync(`npm install && (aws s3api get-bucket-location --bucket ${config.setup.bucket_name} --region ${config.setup.region} || npm run create-bucket) && npm run package-upload-function && npm run upload-api-gateway-swagger && npm run create-stack`))
})
