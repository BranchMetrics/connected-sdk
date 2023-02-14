#/bin/bash

# To trigger a production build

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Prod build
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}Start build for Prod release...${NC}\n"

  echo -en "${GREEN}call make with release...${NC}\n"
  make release

# Exit prompts
echo -en "${GREEN}Done build for Prod release...${NC}\n"
