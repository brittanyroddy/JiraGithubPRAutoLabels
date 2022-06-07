# jira-github-auto-labels

## Setup

To deploy the AWS SAM stack version, you will need:
1. Access to an AWS account with a valid IAM role configured for commandline resource management. See https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started_create-admin-group.html for assistance. I have included an example IAM policy that can be used to limit the permissions given to the IAM role. Be sure to add the appropriate AWS account number where indicated before adding the policy.
2. The AWS SAM CLI installed.
3. Node 16 installed.

## Build and deploy

1. Run the build command: `sam build`
2. Run the deploy command: `sam deploy --resolve-s3`