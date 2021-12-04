import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
  AuroraMysqlEngineVersion,
  AuroraPostgresEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
} from 'aws-cdk-lib/aws-rds';

/*
 * Medium instance classes used as small is not availble for PostgreSQL. Small could be used for MySQL.
 */
export const createClusters = (scope: Stack, vpc: IVpc): { mysql: DatabaseCluster; pg: DatabaseCluster } => {
  const defaultDatabaseName = scope.node.tryGetContext('db-name');

  const mysql = new DatabaseCluster(scope, 'MysqlDb', {
    iamAuthentication: true,
    credentials: Credentials.fromGeneratedSecret('main'),
    defaultDatabaseName,
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

  const pg = new DatabaseCluster(scope, 'PgDb', {
    iamAuthentication: true,
    credentials: Credentials.fromGeneratedSecret('main'),
    defaultDatabaseName,
    engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_13_4 }),
    instanceProps: {
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MEDIUM),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      vpc,
    },
    removalPolicy: RemovalPolicy.DESTROY,
  });

  return { mysql, pg };
};
