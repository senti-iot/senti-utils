#!/bin/bash

if [[ "$1" == "master" ]]; then
	echo
	echo Deploying Senti template $1 ...
	rsync -r --quiet $2/ deploy@rey.webhouse.net:/srv/nodejs/senti/services/template/production
	echo
	echo Restarting Senti template service: $1 ...
	ssh deploy@rey.webhouse.net "sudo /srv/nodejs/senti/services/template/production/scripts/service-restart.sh master $3"
	echo
	echo Deployment to Senti template $1 and restart done!
	exit 0
fi

if [[ "$1" == "dev" ]]; then
	echo
	echo Deploying Senti template $1 ...
	rsync -r --quiet $2/ deploy@rey.webhouse.net:/srv/nodejs/senti/services/template/development
	echo
	echo Restarting Senti template service: $1 ...
	ssh deploy@rey.webhouse.net "sudo /srv/nodejs/senti/services/template/development/scripts/service-restart.sh dev $3"
	echo
	echo Deployment to Senti template $1 and restart done!
	exit 0
fi