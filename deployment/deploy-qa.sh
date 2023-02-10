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
  aws s3 sync ./dist s3://branch-builds/connected-sdk/

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"
