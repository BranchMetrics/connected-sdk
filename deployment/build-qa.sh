#/bin/bash

# To trigger a production deploy push a
# commit with these items:
#
# version: x.y.z
# Changelog:

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Master Deploy
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}Start build for QA release...${NC}\n"

  echo -en "${GREEN}call make ...${NC}\n"
  make
  aws s3 sync ./dist s3://branch-builds-usw2/connected-sdk/
# Exit prompts
echo -en "${GREEN}Done build for QA release...${NC}\n"
