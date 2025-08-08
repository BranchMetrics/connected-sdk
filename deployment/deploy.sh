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

if [ "$CIRCLE_BRANCH" == 'master' ]; then

  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}make release ...${NC}\n"
  make release

  echo -en "${GREEN}Pushing to S3: branch-builds/connected-sdk/ ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds-usw2/connected-sdk/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds-usw2/connected-sdk/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds-usw2/connected-sdk/branch-v2.0.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds-usw2/connected-sdk/branch.js --acl public-read
  aws s3 cp example.html s3://branch-builds-usw2/connected-sdk/example.html --acl public-read

else
    echo -en "${GREEN}No associated target to $CIRCLE_BRANCH - not Deploying${NC}\n"
    exit 0
fi

# Rollbar updates
if [ "$CIRCLE_BRANCH" == 'production' ] || [ "$CIRCLE_BRANCH" == 'master' ] ; then
    pip3 install requests
    pip3 uninstall -y urllib3; pip3 install urllib3==1.22 --user
    deployment/rollbar.py
fi

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"
