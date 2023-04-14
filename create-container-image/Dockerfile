# Dockerfile to build console image from pre-built front end.

FROM openshift/origin-base
COPY ./bridge-linux /opt/bridge/bin/bridge
COPY ./schema.graphql /pkg/graphql/schema.graphql
COPY ./dist /opt/bridge/static

USER 1001
CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]
