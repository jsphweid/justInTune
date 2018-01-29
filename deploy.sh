#!/bin/bash

bucket_name=$(<~/.aws/main_bucket_name)
cloudfront_id=$(<~/.aws/main_cloudfront_id)

aws s3 sync ./ s3://${bucket_name}/justInTune --delete \
    --exclude "deploy.sh" \
    --exclude ".git*" \
    --exclude "*.DS_Store" \
    --exclude "*.iml"
aws cloudfront create-invalidation --distribution-id ${cloudfront_id} --paths "/*"