  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}Pushing to S3: branch-builds ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" temp/build.min.js.gz s3://branch-builds/websdk/branch-2.72.0.min.js
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" temp/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" temp/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js
  aws s3 cp --content-type="text/javascript" temp/build.js s3://branch-builds/websdk/branch.js
  aws s3 cp temp/example.html s3://branch-builds/websdk/example.html

