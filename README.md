# Account Validator Web

### Overview

A web frontend for the account-validation service, allowing users to test XBRL validation on their accounts.

### Requirements

In order to run the service locally you will need the following:

- [NodeJS](https://nodejs.org/en/)
- [Git](https://git-scm.com/downloads)
- [Docker](https://www.docker.com/)
- [Tilt](https://tilt.dev/)
- [Typescript](https://www.typescriptlang.org/)
- [NunJucks](https://mozilla.github.io/nunjucks)
- [ExpressJS](https://expressjs.com/)
- [GOV.UK Design System](https://design-system.service.gov.uk/)


## Running locally on Docker env

The only local development mode available, using development orchestrator service in [Docker CHS Development](https://github.com/companieshouse/docker-chs-development), that uses [tilt](https://tilt.dev/).

1. Clone [Docker CHS Development](https://github.com/companieshouse/docker-chs-development) and follow the steps in the README.
2. Run `./bin/chs-dev modules enable accounts`
3. Run `./bin/chs-dev development enable account-validator-web` (this will allow you to make changes in real time).
4. Run docker using `tilt up` in the docker-chs-development directory.
5. Use spacebar in the command line to open tilt window - wait for account-validator-web to become green.(If you have credential errors then  you may not be logged into `eu-west-2`.)
6. Open your browser and go to page <http://chs.local/xbrl_validate/>

Environment variables used to configure this service in docker are located in the file `services/modules/accounts/account-validator-web.docker-compose.yaml`

### Requirements

1. node v18 (Concourse pipeline builds using Node 18 and live runs on Node 18)
2. npm 8.6+
3. Docker

### Build and Test changes

1. To compile the project use `make build`
2. To test the project use `make test`
3. or `make clean build test`

### To build the Docker container

Ensure that you are logged into the AWS eu-west-2 region:

`aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 416670754337.dkr.ecr.eu-west-2.amazonaws.com`

and then run:

`DOCKER_BUILDKIT=0 docker build --build-arg SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" --build-arg SSH_PRIVATE_KEY_PASSPHRASE -t 416670754337.dkr.ecr.eu-west-2.amazonaws.com/account-validator-web .`

### Endpoints

Method   | Path                                      | Description
---------|-------------------------------------------|--------------------------------------------------------------------
GET      | `/xbrl_validate/healthcheck`              | Healthcheck endpoint
GET      | `/xbrl_validate`                          | Returns the landing page for account validator service
GET      | `/xbrl_validate/submit-accounts`          | Returns the accounts file upload page ( sessionless )
POST     | `/xbrl_validate/submit-accounts`          | Submit the selected accounts file ( javascript disabled )
POST     | `/xbrl_validate/submit-accounts/validate` | Submit the selected accounts file ( javascript enabled )
GET      | `/xbrl_validate/submit`                   | Returns the accounts file upload page ( with session, part of filing journey )
POST     | `/xbrl_validate/submit`                   | Submit the selected accounts file ( javascript disabled )
POST     | `/xbrl_validate/submit/validate`          | Submit the selected accounts file ( javascript enabled )
GET      | `/xbrl_validate/progress/:id`             | Returns the progress page
GET      | `/xbrl_validate/result/:id`               | Returns the results page
GET      | `/xbrl_validate/render/:id`               | Returns the pdf render page
GET      | `/xbrl_validate/error`                    | Returns the error page

---
**Note:** /submit-accounts and /submit paths differ in the middleware applied
**Note:** GET for /submit-accounts and /submit will display different templates if packageType parameter such as 'cic' is provided

### Config variables

Key                                  | Example Value    | Description
-------------------------------------|------------------|-------------------------------------
CDN_HOST                             | //$CDN_HOST      | Path to CH styling for frontend
LOG_LEVEL                            | trace            |
ACCOUNT_VALIDATOR_MAX_FILE_SIZE      | 30MB             | Max file size
ACCOUNT_VALIDATOR_UI_UPDATE_INTERVAL | 10s              | Time interval
ACCOUNT_VALIDATOR_UI_UPDATE_TIMEOUT  | 15m              |
RESULT_RELOAD_DURATION_SECONDS       | 5                |


### Further Information
For further information on running building and testing ch node js apps see the [Node Web Starter](https://github.com/companieshouse/node-web-starter/blob/master/README.md) page.

