import { App } from '@aws-cdk/core';
import { RDSIAMAuthStack } from './rds-iam-auth-stack';

const app = new App();

new RDSIAMAuthStack(app, 'RdsIAMAuthStack', {
  description: 'RDS IAM Auth Stack',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackName: 'rds-iam-auth-stack',
});
