#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { XAmzHmacStack } from '../lib/x-amz-hmac-stack';

const app = new cdk.App();
new XAmzHmacStack(app, 'XAmzHmacStack');
