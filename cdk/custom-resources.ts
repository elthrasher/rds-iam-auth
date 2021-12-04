import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DatabaseCluster } from 'aws-cdk-lib/aws-rds';
import { ArnFormat, CustomResource, Stack } from 'aws-cdk-lib/core';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, Provider } from 'aws-cdk-lib/custom-resources';

import { LambdaFunctions } from './lambda';

export const createCustomResources = (
  scope: Stack,
  fns: LambdaFunctions,
  clusters: { mysql: DatabaseCluster; pg: DatabaseCluster },
): void => {
  /*
   * Custom resource executing mysql-ddl to create table and role for mysql;
   */
  const mysqlDdlProvider = new Provider(scope, 'MySQLDdlProvider', {
    onEventHandler: fns.mysqlDdl,
  });
  const mysqlResource = new CustomResource(scope, 'MySQLDdlResource', {
    serviceToken: mysqlDdlProvider.serviceToken,
  });
  mysqlResource.node.addDependency(clusters.mysql);

  /*
   * Custom resource executing pg-ddl to create table and role for postgres;
   */
  const pgDdlProvider = new Provider(scope, 'PgDdlProvider', {
    onEventHandler: fns.pgDdl,
  });
  const pgResource = new CustomResource(scope, 'PgDdlResource', {
    serviceToken: pgDdlProvider.serviceToken,
  });
  pgResource.node.addDependency(clusters.pg);
};

/*
 * Given a cluster we've just created, fetch the ResourceId.
 * The ResourceId is needed to get the full ARN to create a policy that will allow IAM Authentication.
 * This isn't supported in CloudFormation but thanks to a little CDK workaround,
 * we can look up the value during stack creation.
 * https://github.com/aws/aws-cdk/issues/11851#issuecomment-834057082
 */
export const getDBUserArn = (scope: Stack, cluster: DatabaseCluster, name: string): string => {
  const iamUser = scope.node.tryGetContext('iam-user');

  const dbResourceId = new AwsCustomResource(scope, `${name}ResourceId`, {
    logRetention: RetentionDays.ONE_DAY,
    onCreate: {
      action: 'describeDBClusters',
      parameters: {
        DBClusterIdentifier: cluster.clusterIdentifier,
      },
      physicalResourceId: PhysicalResourceId.of('Data.DBClusters.0.DBClusterResourceId'),
      service: 'RDS',
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
  });

  const resourceId = dbResourceId.getResponseField('DBClusters.0.DbClusterResourceId');
  return scope.formatArn({
    arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    resource: 'dbuser',
    resourceName: `${resourceId}/${iamUser}`,
    service: 'rds-db',
  });
};
