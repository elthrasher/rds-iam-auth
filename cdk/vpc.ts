import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  LookupMachineImage,
  NatInstanceProvider,
  SubnetType,
  Vpc,
} from '@aws-cdk/aws-ec2';
import { Stack } from '@aws-cdk/core';

export const createVpc = (scope: Stack): IVpc =>
  new Vpc(scope, 'rds-iam-vpc', {
    maxAzs: 2,
    // Thanks https://github.com/AndrewGuenther/fck-nat/
    natGatewayProvider: new NatInstanceProvider({
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      machineImage: new LookupMachineImage({
        name: 'fck-nat-*-arm64-ebs',
        owners: ['568608671756'],
      }),
    }),
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
