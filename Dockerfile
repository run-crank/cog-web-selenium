FROM ubuntu:18.04

#update environment
RUN apt-get -y upgrade
RUN apt-get -y update
RUN apt-get -y --with-new-pkgs upgrade
RUN apt-get -y autoremove

#install chrome
RUN apt-get -y install lsb-release libappindicator3-1
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb || true
RUN apt-get -fy install

#install curl
RUN apt-get -y install curl wget

#install node
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get -y install nodejs
RUN node --version
RUN npm --version

#install pm2
RUN npm install pm2 -g --production

FROM mhart/alpine-node:12 AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm install \
  && npm run build-ts \
  && npm prune --production

RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 && \
  echo "37f2c1f0372a45554f1b89924fbb134fc24c3756efaedf11e07f599494e0eff9  /usr/local/bin/dumb-init" | sha256sum -c - && \
  chmod 755 /usr/local/bin/dumb-init

# Only copy over the node pieces we need from the above image
FROM mhart/alpine-node:slim-12 AS final
WORKDIR /app
COPY --from=build /usr/local/bin/dumb-init /usr/local/bin/dumb-init
COPY --from=build /app .
COPY . .
EXPOSE 28866
LABEL com.automatoninc.cog-for="Browser Selenium"
ENTRYPOINT ["/usr/local/bin/dumb-init", "--", "node", "build/core/grpc-server.js"]
