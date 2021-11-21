import { IVpc, SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { Stack } from '@aws-cdk/core';

export const createVpc = (scope: Stack): IVpc =>
  new Vpc(scope, 'rds-iam-vpc', {
    maxAzs: 2,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'ingress',
        subnetType: SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'compute',
        subnetType: SubnetType.PRIVATE_WITH_NAT,
      },
      {
        cidrMask: 28,
        name: 'rds',
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });
