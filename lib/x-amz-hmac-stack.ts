import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export class XAmzHmacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'hmac.sh',
    });

    const certificate = new certmgr.Certificate(this, 'Certificate', {
      domainName: 'hmac.sh',
      validation: certmgr.CertificateValidation.fromDns(zone),
    });

    const cfFunction = new cloudfront.Function(this, 'CloudFrontFunction', {
      functionName: 'xAmzDateFunction',
      comment: 'Return current X-Amz-Date string',
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromFile({ filePath: 'function.js' }),
    });

    const distribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('example.com', {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        compress: false,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: cfFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
          },
        ],
      },
      domainNames: ['hmac.sh'],
      certificate,
    });

    new route53.ARecord(this, 'ApexAliasRecord', {
      zone,
      recordName: 'hmac.sh',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });
  }
}
