import { expect, haveResource } from '@aws-cdk/assert';
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');
import { Test } from 'nodeunit';
import apigw = require('../lib');

// tslint:disable:object-literal-key-quotes

export = {
  'LambdaRestApi defines a REST API with Lambda proxy integration'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const handler = new lambda.Function(stack, 'handler', {
      handler: 'index.handler',
      code: lambda.Code.inline('boom'),
      runtime: lambda.Runtime.NodeJS610,
    });

    // WHEN
    new apigw.LambdaRestApi(stack, 'lambda-rest-api', { handler, proxyPath: '/' });

    // THEN
    expect(stack).to(haveResource('AWS::ApiGateway::Resource', {
      "PathPart": "{proxy+}"
    }));

    expect(stack).to(haveResource('AWS::ApiGateway::Method', {
      "HttpMethod": "ANY",
      "ResourceId": {
        "Ref": "lambdarestapiproxyE3AE07E3"
      },
      "RestApiId": {
        "Ref": "lambdarestapiAAD10924"
      },
      "AuthorizationType": "NONE",
      "Integration": {
        "IntegrationHttpMethod": "POST",
        "Type": "AWS_PROXY",
        "Uri": {
          "Fn::Join": [
            "",
            [
              "arn",
              ":",
              {
                "Ref": "AWS::Partition"
              },
              ":",
              "apigateway",
              ":",
              {
                "Ref": "AWS::Region"
              },
              ":",
              "lambda",
              ":",
              "path",
              "/",
              {
                "Fn::Join": [
                  "",
                  [
                    "2015-03-31/functions/",
                    {
                      "Fn::GetAtt": [
                        "handlerE1533BD5",
                        "Arn"
                      ]
                    },
                    "/invocations"
                  ]
                ]
              }
            ]
          ]
        }
      }
    }));

    test.done();
  },

  'proxyPath can be used to attach the proxy to any route'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const handler = new lambda.Function(stack, 'handler', {
      handler: 'index.handler',
      code: lambda.Code.inline('boom'),
      runtime: lambda.Runtime.NodeJS610,
    });

    // WHEN
    new apigw.LambdaRestApi(stack, 'lambda-rest-api', {
      handler,
      proxyPath: '/backend/v2'
    });

    // THEN
    expect(stack).to(haveResource('AWS::ApiGateway::Method', {
      "ResourceId": {
        "Ref": "lambdarestapibackendv2proxyC4980BD5"
      }
    }));

    test.done();
  },

  'when "proxyPath" is not specified, users need to define the model'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const handler = new lambda.Function(stack, 'handler', {
      handler: 'index.handler',
      code: lambda.Code.inline('boom'),
      runtime: lambda.Runtime.NodeJS610,
    });

    // WHEN
    const api = new apigw.LambdaRestApi(stack, 'lambda-rest-api', { handler });

    const tasks = api.root.addResource('tasks');
    tasks.addMethod('GET');
    tasks.addMethod('POST');

    // THEN
    expect(stack).notTo(haveResource('AWS::ApiGateway::Resource', {
      "PathPart": "{proxy+}"
    }));

    expect(stack).to(haveResource('AWS::ApiGateway::Resource', {
      PathPart: 'tasks'
    }));

    expect(stack).to(haveResource('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ResourceId: { Ref: 'lambdarestapitasks224418C8' }
    }));

    expect(stack).to(haveResource('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      ResourceId: { Ref: 'lambdarestapitasks224418C8' }
    }));

    test.done();
  },

  'fails if options.defaultIntegration is also set'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const handler = new lambda.Function(stack, 'handler', {
      handler: 'index.handler',
      code: lambda.Code.inline('boom'),
      runtime: lambda.Runtime.NodeJS610,
    });

    test.throws(() => new apigw.LambdaRestApi(stack, 'lambda-rest-api', {
      handler,
      options: { defaultIntegration: new apigw.HttpIntegration('https://foo/bar') }
    }), /Cannot specify \"options\.defaultIntegration\" since Lambda integration is automatically defined/);

    test.done();
  }
};