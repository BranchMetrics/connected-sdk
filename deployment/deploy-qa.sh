#/bin/bash

# Deploy to QA

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'




GIT_COMMIT_MSG=$(git log --format=%B -n 1)
echo "GIT_COMMIT_MSG is $GIT_COMMIT_MSG"
VER=$(echo "$GIT_COMMIT_MSG" | grep version | cut -f 2 -d " ")
echo "VER is $VER"
VERSION=$(echo $VER|tr -d '\r')
echo "VERSION is $VERSION"
DATE=$(date "+%Y-%m-%d")
echo "DATE is $DATE"

if [[ "$GIT_COMMIT_MSG" != *"version"* ]]; then
      echo "Version not found in commit message - Not deploying"
      exit 0
fi

VER_REG='^([0-9]+\.){0,2}(\*|[0-9]+)$'

if [[ $VERSION =~ $VER_REG ]]; then
     echo -en "${GREEN} Extracted version $VERSION ${NC}\n"
else
     echo -en "${RED}ERROR: Wrong version input: '$VERSION' - Exiting Build ${NC}\n"
     exit 1
fi
# Expect a Changelog in commit message
CHANGELOG=$(echo "$GIT_COMMIT_MSG" | awk '/Changelog/{y=1;next}y')
INSERT="## [v$VERSION] - $DATE"

if [ -z "$CHANGELOG" ]; then
      echo "Changelog not found in commit message - Not deploying"
      exit 0
fi

echo -en "\n${GREEN}Extracted Changelog:\n$INSERT\n$CHANGELOG\n${NC}\n"
#--------------------------------------------------------------------------------------------
# Main branch (QA) Deploy
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}Start QA Release...${NC}\n"

  echo -en "${GREEN}Pushing to S3: branch-builds/connected-sdk/ ...${NC}\n"
  aws s3 sync ./dist s3://branch-builds/connected-sdk/
  aws s3 sync ./dist s3://branch-cdn/

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"
