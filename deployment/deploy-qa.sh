#/bin/bash

# Deploy to QA

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'




GIT_COMMIT_MSG=$(git log --format=%B -n 1)
echo "$GIT_COMMIT_MSG"
VER=$(echo "$GIT_COMMIT_MSG" | grep version | cut -f 2 -d " ")
echo "$VER"
VERSION=$(echo $VER|tr -d '\r')
echo "$VERSION"
DATE=$(date "+%Y-%m-%d")
echo "$DATE"


#--------------------------------------------------------------------------------------------
# Main branch (QA) Deploy
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}Start QA Release...${NC}\n"

  echo -en "${GREEN}Pushing to S3: branch-builds/connected-sdk/ ...${NC}\n"
  aws s3 sync ./dist s3://branch-builds/connected-sdk/

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"
