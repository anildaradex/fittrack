#!/usr/bin/env bash
# One-time: after authorizing the Cloud Build GitHub connection in the browser,
# link the repo and create the push-to-main trigger. Safe to re-run.
set -euo pipefail
P=fittrack-prod-anildara; R=us-central1; CONN=fittrack-github

echo "connection state:"; gcloud builds connections describe $CONN --region=$R --project=$P --format="value(installationState.stage)"
gcloud builds repositories create fittrack --connection=$CONN --remote-uri=https://github.com/anildaradex/fittrack.git --region=$R --project=$P 2>&1 | tail -1 || true
gcloud builds triggers create github --name=deploy-main --region=$R --project=$P \
  --repository=projects/$P/locations/$R/connections/$CONN/repositories/fittrack \
  --branch-pattern='^main$' --build-config=cloudbuild.yaml \
  --service-account=projects/$P/serviceAccounts/771990849353-compute@developer.gserviceaccount.com 2>&1 | tail -2 || true
gcloud builds triggers list --region=$R --project=$P --format="table(name,github.push.branch,filename)"
