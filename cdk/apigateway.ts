import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Stack } from 'aws-cdk-lib';

import { LambdaFunctions } from './lambda';

export const createApiGateway = (scope: Stack, fns: LambdaFunctions): HttpApi => {
  const httpApi = new HttpApi(scope, 'IamAuthApi');

  httpApi.addRoutes({
    integration: new HttpLambdaIntegration('MySQLIntegration', fns.mysqlQuery),
    methods: [HttpMethod.GET],
    path: '/mysql',
  });

  httpApi.addRoutes({
    integration: new HttpLambdaIntegration('PGIntegration', fns.pgQuery),
    methods: [HttpMethod.GET],
    path: '/pg',
  });

  return httpApi;
};
