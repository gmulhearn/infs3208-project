FROM ubuntu:18.04

LABEL maintainer="g.mulhearn@uqconnect.edu.au"

ENV TZ=Australia/Brisbane

# update timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# get neccessary packages
RUN apt update -y \
    && apt install -y nginx curl vim \
    && apt-get install -y software-properties-common \
    && add-apt-repository -y ppa:certbot/certbot \
    && apt-get -y update \
    && apt-get install -y python-certbot-nginx \
    && apt-get clean 

# get most node 16.x (and npm 7.x)
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs

# assumes run from root folder (not client)
COPY $PWD/nginx/nginx.ini /etc/nginx/sites-available/default
COPY $PWD/client /var/www/html
WORKDIR /var/www/html
RUN rm -rf node_modules package-lock.json

# install webapp dependencies and build as static
RUN npm install && npm run build

# start nginx server
ENTRYPOINT nginx -g "daemon off;"