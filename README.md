# account-validator-web

A web frontend for the account-validation service, allowing users to test XBRL validation on their accounts.

# Local Setup

1. [Node setup](https://nodejs.org) - preferably greater than or same as version 12
2. Git SSH setup
    > 1. **`ssh-keygen -t rsa`**
    > 2. **`cat ~/.ssh/id_rsa.pub`**
    > 3. Copy key into github
3. Starting Services locally
    > The only local development mode available, that includes account, redis and other important service/dependency is only possible through our development orchestrator service in [Docker CHS Development](https://github.com/companieshouse/docker-chs-development), that uses [tilt](https://tilt.dev/).
    > 1. Clone [Docker CHS Development](https://github.com/companieshouse/docker-chs-development) and follow the steps in the README.
    > 2. Run **`./bin/chs-dev development enable account-validator-web`** (this will allow you to make changes in real time).
    > 3. Run docker using **`tilt up`** in the docker-chs-development directory.
    > 4. Use spacebar in the command line to open tilt window - wait for account-validator-web to become green.
    > 5. Open your browser and go to page <http://chs.local/xbrl_validate/>
4. Build docker container:
    > 1. **DOCKER_BUILDKIT=0 docker build --build-arg SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" --build-arg SSH_PRIVATE_KEY_PASSPHRASE -t 169942020521.dkr.ecr.eu-west-1.amazonaws.com/local/account-validator-web .**