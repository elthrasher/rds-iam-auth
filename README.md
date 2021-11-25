# RDS IAM Auth

An example of using IAM to authenticate a Lambda function to AWS RDS using AWS CDK.

## :warning: This Example is not Serverless! :warning:

This stack includes two medium RDS clusters ~~and the [dreaded Managed NAT Gateway](https://www.lastweekinaws.com/blog/the-aws-managed-nat-gateway-is-unpleasant-and-not-recommended/)~~. Managed NAT Gateway is replaced with [fck-nat](https://github.com/AndrewGuenther/fck-nat/)! The databases will still cost some money.

## Stack Info

Both MySQL and PostgreSQL databases are shown. CDK code will create a VPC, medium Aurora instances and will create a table within each database.
HttpApi is provided to execute query Lambda functions.

* `npm i`
* `npm run deploy`
* Grab generated url from the console and visit `/mysql` and `/pg` endpoints.
* have fun doing stuff
* `npm run destroy`
