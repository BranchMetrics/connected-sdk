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

  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}make release ...${NC}\n"
  make release

# Exit prompts
echo -en "${GREEN}Done make ...${NC}\n"
