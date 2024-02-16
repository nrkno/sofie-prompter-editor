#!/usr/bin/env sh
set -e

# load environment variables from file
if [ ! -z "$PROMPTER_ENV_FILE" ]
then
    echo "Loading environment variables from $PROMPTER_ENV_FILE"
    set -o allexport
    source "$PROMPTER_ENV_FILE"
    set +o allexport
fi

# launch the app
node dist/index.js $@