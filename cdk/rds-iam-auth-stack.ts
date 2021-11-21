import { Construct, Stack, StackProps } from '@aws-cdk/core';
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

    createApiGateway(this, fns);
  }
}
