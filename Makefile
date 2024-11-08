artifact_name       := account-validator-web
version             := "unversioned"

.PHONY: all
all: build

.PHONY: clean
clean:
	rm -f ./$(artifact_name)-*.zip
	rm -rf ./dist
	rm -f ./build.log
	rm -rf assets/dist

.PHONY: build
build:
	npm ci
	npm run build

.PHONY: lint
lint:
	npm run lint

.PHONY: sonar
sonar: test
	npm run sonarqube

.PHONY: test-unit
test-unit:
	npm run test

.PHONY: test
test:
	npm run coverage

.PHONY: package
package: build
ifndef version
	$(error No version given. Aborting)
endif
	$(info Packaging version: $(version))
	$(eval tmpdir := $(shell mktemp -d build-XXXXXXXXXX))
	# mkdir $(tmpdir)/api-enumerations
	# cp ./api-enumerations/*.yml $(tmpdir)/api-enumerations
	cp -r ./dist/* $(tmpdir)
	cp -r ./package.json $(tmpdir)
	cp -r ./package-lock.json $(tmpdir)
	cp -r ./.git $(tmpdir)
	cd $(tmpdir) && npm ci --production
	rm $(tmpdir)/package.json $(tmpdir)/package-lock.json
	cd $(tmpdir) && zip -r ../$(artifact_name)-$(version).zip .
	rm -rf $(tmpdir)

.PHONY: dist
dist: lint test clean package

.PHONY: security-check
security-check:
	npm audit
