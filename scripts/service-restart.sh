#!/bin/bash
# chmod 700 api-restart.sh

if [[ "$1" == "master" ]]; then
	npm install --prefix /srv/nodejs/senti/services/utils/production
	systemctl restart senti-utils.service
	sleep 5
	logtext=$( systemctl status senti-utils | sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g;' | sed -e 's/\(  \)//g;' )
	# Senti Slack Workspace
	curl -X POST -H 'Content-type: application/json' --data '{
	"blocks": [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Senti utils updated",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Branch:*\n'$1'"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Travis",
					"emoji": true
				},
				"value": "travis-link",
				"url": "http://travis-ci.com/github/senti-iot/senti-service",
				"action_id": "button-action"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "System Log:",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "```'"$logtext"'```"
			}
		},
		{
			"type": "divider"
		}
	]
}' $2
	echo
	exit 0
fi

if [[ "$1" == "dev" ]]; then
	npm install --prefix /srv/nodejs/senti/services/utils/development
	systemctl restart senti-utils-dev.service
	logtext=$( systemctl status senti-utils-dev| sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g;' | sed -e 's/\(  \)//g;' )
	# Senti Slack Workspace
	curl -X POST -H 'Content-type: application/json' --data '{
	"blocks": [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Senti utils updated",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Branch:*\n'$1'"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Travis",
					"emoji": true
				},
				"value": "travis-link",
				"url": "http://travis-ci.com/github/senti-iot/senti-service",
				"action_id": "button-action"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "System Log:",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "```'"$logtext"'```"
			}
		},
		{
			"type": "divider"
		}
	]
}' $2
	echo
	exit 0
fi

exit 0
