import { App, RemovalPolicy, SecretValue, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InstanceClass, InstanceSize, InstanceType, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AuroraMysqlEngineVersion, Credentials, DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';

import { createLambdaFunctions } from './lambda';
import { createClusters } from './rds';
import { createVpc } from './vpc';

describe('API Gateway', () => {
  test('returns Lambda functions', () => {
    const app = new App();
    const stack = new Stack(app, 'ApiTestStack', { env: { account: '123456789', region: 'us-east-1' } });
    const vpc = createVpc(stack);
    createLambdaFunctions(stack, vpc, createClusters(stack, vpc));
    const cfn = Template.fromStack(stack).toJSON();
    const resources = cfn.Resources;
    const matchObject: { Parameters: Record<string, unknown>; Resources: Record<string, unknown> } = {
      Parameters: expect.any(Object),
      Resources: {},
    };
    Object.keys(resources).forEach((res) => {
      switch (resources[res].Type) {
        case 'AWS::Lambda::Function':
          matchObject.Resources[res] = {
            Properties: { Code: expect.any(Object) },
          };
          break;
        default:
          break;
      }
    });

    expect(cfn).toMatchSnapshot(matchObject);
  });

  test(`Fail if DB isn't created with a secret`, () => {
    expect.assertions(1);
    try {
      const app = new App();
      const stack = new Stack(app, 'ApiTestStack', { env: { account: '123456789', region: 'us-east-1' } });
      const vpc = createVpc(stack);
      const cluster = new DatabaseCluster(stack, 'MysqlDb', {
        credentials: Credentials.fromPassword('dummy', SecretValue.plainText('donotuseplaintextpasswords')),
        engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_10_0 }),
        instanceProps: {
          instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MEDIUM),
          vpcSubnets: {
            subnetType: SubnetType.PRIVATE_ISOLATED,
          },
          vpc,
        },
        removalPolicy: RemovalPolicy.DESTROY,
      });
      createLambdaFunctions(stack, vpc, { mysql: cluster, pg: cluster });
      Template.fromStack(stack);
    } catch (e) {
      expect((e as Error).message).toBe('Database lacks a secret!');
    }
  });
});
