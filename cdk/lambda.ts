import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IVpc, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DatabaseCluster } from 'aws-cdk-lib/aws-rds';

import { getDBUserArn } from './custom-resources';

const functionNames = ['mysqlDdl', 'mysqlQuery', 'pgDdl', 'pgQuery'] as const;

export type LambdaFunctions = {
  [key in typeof functionNames[number]]: LambdaFunction;
};

export const createLambdaFunctions = (
  scope: Stack,
  vpc: IVpc,
  clusters: { mysql: DatabaseCluster; pg: DatabaseCluster },
): LambdaFunctions => {
  // Pass in the clusters we've created.
  const { mysql, pg } = clusters;
  // Get some values from the context
  const iamDB = scope.node.tryGetContext('db-name');
  const iamUser = scope.node.tryGetContext('iam-user');
  const mysqlPort = scope.node.tryGetContext('mysql-port');
  const pgPort = scope.node.tryGetContext('pg-port');

  // Validate secrets are available
  if (!mysql.secret || !pg.secret) {
    throw new Error('Database lacks a secret!');
  }

  // All functions need the iamUser (string) and vpc config
  const lambdaProps = {
    bundling: { externalModules: [] },
    environment: { IAM_DB: iamDB, IAM_USER: iamUser },
    runtime: Runtime.NODEJS_14_X,
    timeout: Duration.minutes(1),
    vpc,
    vpcSubnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_NAT }),
  };

  const mysqlLambdaProps = {
    ...lambdaProps,
    securityGroups: [mysql.connections.securityGroups[0]],
  };

  const pgLambdaProps = {
    ...lambdaProps,
    bundling: { ...lambdaProps.bundling, externalModules: ['pg-native'] },
    securityGroups: [pg.connections.securityGroups[0]],
  };

  // Function to create the schema using master credentials
  const mysqlDdl = new NodejsFunction(scope, 'MysqlDdl', {
    ...mysqlLambdaProps,
    entry: `${__dirname}/../fns/mysql-ddl.ts`,
    environment: { ...mysqlLambdaProps.environment, SECRET_ARN: mysql.secret.secretArn },
    functionName: 'mysqlDdl',
  });

  // Function to execute a query using IAM Authentication
  const mysqlQuery = new NodejsFunction(scope, 'MysqlQuery', {
    ...mysqlLambdaProps,
    entry: `${__dirname}/../fns/mysql-query.ts`,
    environment: { ...mysqlLambdaProps.environment, DB_HOSTNAME: mysql.clusterReadEndpoint.hostname },
    functionName: 'mysqlQuery',
  });

  // Add the policy that allows mysqlQuery to connect via IAM Auth
  const mysqlUserArn = getDBUserArn(scope, mysql, 'mysql');
  mysqlQuery.addToRolePolicy(
    new PolicyStatement({
      actions: ['rds-db:connect'],
      effect: Effect.ALLOW,
      resources: [mysqlUserArn],
    }),
  );

  // Function to create teh schema using master credentials
  const pgDdl = new NodejsFunction(scope, 'PgDdl', {
    ...pgLambdaProps,
    entry: `${__dirname}/../fns/pg-ddl.ts`,
    environment: { ...pgLambdaProps.environment, SECRET_ARN: pg.secret.secretArn },
    functionName: 'pgDdl',
  });

  // Function to execute a query using IAM Auth
  const pgQuery = new NodejsFunction(scope, 'PgQuery', {
    ...pgLambdaProps,
    entry: `${__dirname}/../fns/pg-query.ts`,
    environment: { ...pgLambdaProps.environment, DB_HOSTNAME: pg.clusterReadEndpoint.hostname },
    functionName: 'pgQuery',
  });

  // Add the policy that allows pgQuery to connect via IAM Auth
  const pgUserArn = getDBUserArn(scope, pg, 'pg');
  pgQuery.addToRolePolicy(
    new PolicyStatement({ actions: ['rds-db:connect'], effect: Effect.ALLOW, resources: [pgUserArn] }),
  );

  // I like to keep log groups tidy. Unfortunately the custom resources will run after stack creation and make more log groups.
  // If this stack is destroyed, the log groups must be removed manually.
  functionNames.forEach(
    (fn) =>
      new LogGroup(scope, `${fn}LogGroup`, {
        logGroupName: `/aws/lambda/${fn}`,
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
  );

  // Only the DDL functions need access to the secrets.
  mysql.secret.grantRead(mysqlDdl);
  pg.secret.grantRead(pgDdl);

  // Create SecurityGroupIngress and apply to each function exactly what's needed.
  mysql.connections.allowFrom(mysqlDdl, Port.tcp(Number(mysqlPort)));
  mysql.connections.allowFrom(mysqlQuery, Port.tcp(Number(mysqlPort)));
  pg.connections.allowFrom(pgDdl, Port.tcp(Number(pgPort)));
  pg.connections.allowFrom(pgQuery, Port.tcp(Number(pgPort)));

  return { mysqlDdl, mysqlQuery, pgDdl, pgQuery };
};
