import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Stack } from '@aws-cdk/core';
import { LambdaFunctions } from './lambda';

export const createApiGateway = (scope: Stack, fns: LambdaFunctions): HttpApi => {
  const httpApi = new HttpApi(scope, 'IamAuthApi');

  httpApi.addRoutes({
    integration: new LambdaProxyIntegration({ handler: fns.mysqlQuery }),
    methods: [HttpMethod.GET],
    path: '/mysql',
  });

  httpApi.addRoutes({
    integration: new LambdaProxyIntegration({ handler: fns.pgQuery }),
    methods: [HttpMethod.GET],
    path: '/pg',
  });

  return httpApi;
};
