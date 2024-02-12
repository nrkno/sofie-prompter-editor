# BUILD IMAGE
FROM node:20
WORKDIR /opt/prompter

COPY . .

RUN corepack enable
RUN yarn install --immutable
RUN yarn build
RUN yarn workspaces focus --production @sofie-prompter-editor/apps-backend # purge dev-dependencies

# perform some cleanup
RUN rm -R packages/apps/client/node_modules || true

# DEPLOY IMAGE
FROM node:20-alpine
RUN apk add --no-cache tzdata

COPY --from=0 /opt/prompter/package.json /opt/prompter/package.json
COPY --from=0 /opt/prompter/node_modules /opt/prompter/node_modules
COPY --from=0 /opt/prompter/packages/apps /opt/prompter/packages/apps
COPY --from=0 /opt/prompter/packages/shared /opt/prompter/packages/shared

WORKDIR /opt/prompter/packages/apps/backend
EXPOSE 5600/TCP
ENTRYPOINT ["node", "dist/index.js"]
