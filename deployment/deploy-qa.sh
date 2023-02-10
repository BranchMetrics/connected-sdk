#/bin/bash

# Deploy to QA

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Main branch (QA) Deploy
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}Start QA Release...${NC}\n"

  echo -en "${GREEN}Pushing to S3: branch-builds/connected-sdk/ ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/branch-connected.min.js.gz s3://branch-builds/connected-sdk/branch-connected.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/branch-connected.js s3://branch-builds/connected-sdk/branch-connected.js --acl public-read
  aws s3 cp dist/connected-example.html s3://branch-builds/connected-sdk/connected-example.html --acl public-read

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"
