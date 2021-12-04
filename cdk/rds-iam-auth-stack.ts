import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { createApiGateway } from './apigateway';
import { createCustomResources } from './custom-resources';
import { createLambdaFunctions } from './lambda';
import { createClusters } from './rds';
import { createVpc } from './vpc';

export class RDSIAMAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = createVpc(this);

    const clusters = createClusters(this, vpc);

    const fns = createLambdaFunctions(this, vpc, clusters);

    createCustomResources(this, fns, clusters);

    const api = createApiGateway(this, fns);

    new CfnOutput(this, 'ApiEndpoint', { value: api.apiEndpoint });
  }
}
