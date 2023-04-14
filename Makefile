REGISTRY_URL?=us.icr.io
REGISTRY_NAMESPACE?=haribala
REGISTRY_IMAGE_NAME?=wisdom-ocp
REGISTRY_IMAGE_TAG?=v1.150
REGISTRY_IMAGE?=${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${REGISTRY_IMAGE_NAME}:${REGISTRY_IMAGE_TAG}

NODE_VERSION=$(shell node --version)

clean:
	rm -rf create-container-image/dist/

check-version:
	@echo "The current NodeJS version is $(NODE_VERSION)"
ifneq ($(NODE_VERSION), v14.16.0)
	@echo 'Unsupported NodeJS version. Please use 14.16.0. Aborting.'
	exit 1
endif

build-static-files: check-version
	@echo 'Press Ctrl+C to stop the yarn development server after it generates the dist/ folder'
	cd frontend && yarn run dev

build-image:
	@echo 'run this after generating the dist/ folder with "make build-static-files"'
	cd create-container-image/ && \
	rm -rf dist/ && cp -r ../frontend/public/dist/ . && \
	docker build -t ${REGISTRY_IMAGE} .

push-image:
	docker push ${REGISTRY_IMAGE}

deploy-image:
	@echo 'make sure you are logged in'
	oc whoami
	@echo 'putting the console operator into an unmanaged state'
	oc patch consoles.operator.openshift.io cluster --patch '{ "spec": { "managementState": "Unmanaged" } }' --type=merge
	@echo "deploying the image ${REGISTRY_IMAGE}"
	oc set image deploy console console=${REGISTRY_IMAGE} -n openshift-console
	@echo 'waiting for the new image to rollout to all the pods'
	oc rollout status -w deploy/console -n openshift-console
