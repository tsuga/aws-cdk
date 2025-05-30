import { partitionInformation } from './aws-entities';
import { Fact, FactName } from './fact';

/**
 * Information pertaining to an AWS region.
 */
export class RegionInfo {
  /**
   * @returns the list of names of AWS regions for which there is at least one registered fact. This
   *          may not be an exaustive list of all available AWS regions.
   */
  public static get regions(): RegionInfo[] {
    return Fact.regions.map(x => RegionInfo.get(x));
  }

  /**
   * Retrieves a collection of all fact values for all regions that fact is defined in.
   *
   * @param factName the name of the fact to retrieve values for.
   *   For a list of common fact names, see the FactName class
   * @returns a mapping with AWS region codes as the keys,
   *   and the fact in the given region as the value for that key
   */
  public static regionMap(factName: string): { [region: string]: string } {
    const ret: { [region: string]: string } = {};
    for (const regionInfo of RegionInfo.regions) {
      const fact = Fact.find(regionInfo.name, factName);
      if (fact) {
        ret[regionInfo.name] = fact;
      }
    }
    return ret;
  }

  /**
   * Retrieves a collection of all fact values for all regions, limited to some partitions
   *
   * @param factName the name of the fact to retrieve values for.
   *   For a list of common fact names, see the FactName class
   * @param partitions list of partitions to retrieve facts for. Defaults
   *   to `['aws', 'aws-cn']`.
   * @returns a mapping with AWS region codes as the keys,
   *   and the fact in the given region as the value for that key
   */
  public static limitedRegionMap(factName: string, partitions: string[]): { [region: string]: string } {
    const ret: Record<string, string> = {};
    for (const [region, value] of Object.entries(RegionInfo.regionMap(factName))) {
      if (partitions.includes(partitionInformation(region).partition)) {
        ret[region] = value;
      }
    }
    return ret;
  }

  /**
   * Obtain region info for a given region name.
   *
   * @param name the name of the region (e.g: us-east-1)
   */
  public static get(name: string): RegionInfo {
    return new RegionInfo(name);
  }

  private constructor(public readonly name: string) {}

  /**
   * Whether the `AWS::CDK::Metadata` CloudFormation Resource is available in this region or not.
   */
  public get cdkMetadataResourceAvailable(): boolean {
    return Fact.find(this.name, FactName.CDK_METADATA_RESOURCE_AVAILABLE) === 'YES';
  }

  /**
   * Whether the given region is an opt-in region
   */
  public get isOptInRegion(): boolean {
    return Fact.find(this.name, FactName.IS_OPT_IN_REGION) === 'YES';
  }

  /**
   * The domain name suffix (e.g: amazonaws.com) for this region.
   */
  public get domainSuffix(): string | undefined {
    return Fact.find(this.name, FactName.DOMAIN_SUFFIX);
  }

  /**
   * The name of the ARN partition for this region (e.g: aws).
   */
  public get partition(): string | undefined {
    return Fact.find(this.name, FactName.PARTITION);
  }

  /**
   * The endpoint used by S3 static website hosting in this region (e.g: s3-static-website-us-east-1.amazonaws.com)
   */
  public get s3StaticWebsiteEndpoint(): string | undefined {
    return Fact.find(this.name, FactName.S3_STATIC_WEBSITE_ENDPOINT);
  }

  /**
   * The hosted zone ID used by Route 53 to alias a S3 static website in this region (e.g: Z2O1EMRO9K5GLX)
   */
  public get s3StaticWebsiteHostedZoneId(): string | undefined {
    return Fact.find(this.name, FactName.S3_STATIC_WEBSITE_ZONE_53_HOSTED_ZONE_ID);
  }

  /**
   * The hosted zone ID used by Route 53 to alias a EBS environment endpoint in this region (e.g: Z2O1EMRO9K5GLX)
   */
  public get ebsEnvEndpointHostedZoneId(): string | undefined {
    return Fact.find(this.name, FactName.EBS_ENV_ENDPOINT_HOSTED_ZONE_ID);
  }

  /**
   * The prefix for VPC Endpoint Service names,
   * cn.com.amazonaws.vpce for China regions,
   * com.amazonaws.vpce otherwise.
   */
  public get vpcEndpointServiceNamePrefix(): string | undefined {
    return Fact.find(this.name, FactName.VPC_ENDPOINT_SERVICE_NAME_PREFIX);
  }

  /**
   * The name of the service principal for a given service in this region.
   * @param service the service name (e.g: s3.amazonaws.com)
   *
   * @deprecated - Use `iam.ServicePrincipal.servicePrincipalName()` instead.
   */
  public servicePrincipal(service: string): string | undefined {
    return `${service.replace(/\.amazonaws\.com(\.cn)?$/, '')}.amazonaws.com`;
  }

  /**
   * The account ID for ELBv2 in this region
   */
  public get elbv2Account(): string | undefined {
    return Fact.find(this.name, FactName.ELBV2_ACCOUNT);
  }

  /**
   * The ID of the AWS account that owns the public ECR repository containing the
   * AWS Deep Learning Containers images in this region.
   */
  public get dlcRepositoryAccount(): string | undefined {
    return Fact.find(this.name, FactName.DLC_REPOSITORY_ACCOUNT);
  }

  /**
   * The ARN of the CloudWatch Lambda Insights extension, for the given version.
   * @param insightsVersion the version (e.g. 1.0.98.0)
   * @param architecture the Lambda Function architecture (e.g. 'x86_64' or 'arm64')
   */
  public cloudwatchLambdaInsightsArn(insightsVersion: string, architecture?: string): string | undefined {
    return Fact.find(this.name, FactName.cloudwatchLambdaInsightsVersion(insightsVersion, architecture));
  }

  /**
   * The ARN of the AppConfig Lambda Layer, for the given version.
   * @param layerVersion The layer version (e.g. 2.0.181)
   * @param architecture The Lambda Function architecture (e.g. 'x86_64' or 'arm64'), defaults to x86_64
   */
  public appConfigLambdaArn(layerVersion: string, architecture?: string) : string | undefined {
    return Fact.find(this.name, FactName.appConfigLambdaLayerVersion(layerVersion, architecture));
  }

  /**
   * The ID of the AWS account that owns the public ECR repository that contains the
   * AWS App Mesh Envoy Proxy images in a given region.
   */
  public get appMeshRepositoryAccount(): string | undefined {
    return Fact.find(this.name, FactName.APPMESH_ECR_ACCOUNT);
  }

  /**
   * The CIDR block used by Amazon Data Firehose servers.
   */
  public get firehoseCidrBlock(): string | undefined {
    return Fact.find(this.name, FactName.FIREHOSE_CIDR_BLOCK);
  }

  /**
   * The ARN of the ADOT Lambda layer, for the given layer type, version and architecture.
   *
   * @param type the type of the ADOT lambda layer
   * @param version the layer version.
   * @param architecture the Lambda Function architecture (e.g. 'x86_64' or 'arm64')
   */
  public adotLambdaLayerArn(type: string, version: string, architecture: string): string | undefined {
    return Fact.find(this.name, FactName.adotLambdaLayer(type, version, architecture));
  }

  /**
   * The ARN of the Parameters and Secrets Lambda layer for the given lambda architecture.
   *
   * @param version the layer version
   * @param architecture the Lambda Function architecture (e.g. 'x86_64' or 'arm64')
   */
  public paramsAndSecretsLambdaLayerArn(version: string, architecture: string): string | undefined {
    return Fact.find(this.name, FactName.paramsAndSecretsLambdaLayer(version, architecture));
  }

  /**
   * SAML Sign On URL used by IAM SAML Principals.
   */
  public get samlSignOnUrl(): string | undefined {
    return Fact.find(this.name, FactName.SAML_SIGN_ON_URL);
  }
}
