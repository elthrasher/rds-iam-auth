# RDS IAM Auth

An example of using IAM to authenticate a Lambda function to AWS RDS using AWS CDK.

Both MySQL and PostgreSQL databases are shown. CDK code will create a VPC, medium Aurora instances and will create a table within each database.
HttpApi is provided to execute query Lambda functions.

* `npm i`
* `npm run deploy`
* <have fun doing stuff>
* `npm run destroy`
