# INFS3208 Project - Mixo
Mixo is a webapp created as an extension of spotify. Mixo allows spotify user's to create playlists which contain both spotify songs and youtube songs/videos.

# Project Architecture / Containers
## Database
The database for this app is a NoSQL mongo db. Mongo sharding has not been implemented, the mongo docker image is simply used without any confirguration.

## Database Admin
The mongo db database contents are accessible thru `TODO`

## Backend
The backend for this app is a nodejs express server. The express server is directly connected to the mongodb. The backend acts as an API for the frontend to make requests to the mongo db and to spotify's API (and youtube's). The user auth is for operations is handled by spotify APIs (using the spotify access token). The backend usings port 3030, allow this is not exposed publicly in the docker-compose configuration, the backend is instead accessed via reverse proxy, set up by the frontend nginx server, i.e. `backend:3030/ => domain.com/api/`.

## Frontend
The frontend is a typescript ReactJS application which talks to the backend server and uses spotify and Youtube SDKs for audio playback. The frontend container is an nginx server which runs the static compiled react app (built with `npm run build`).

# Set Up / Installation
## External Set Up
Before using this app, you must register a Spotify project and acquire the API keys. See Spotify's [guide](https://developer.spotify.com/documentation/general/guides/app-settings/#register-your-app). Additionally, you must whitelist the Redirect URI you wish to use - for local deployment this is just `http://localhost`.

## Docker Compose Usage

To run the app locally, all components/containers of the app can be run using `docker-compose`. Before running docker compose, a `.env` file must be created in this root directory and your Spotify project's `Client ID` and `Client Secret` must be stored in there. The contents of the `.env` file must appear as:
```
SPOTIFY_CLIENT_ID=14e2...[REDACTED]
SPOTIFY_CLIENT_SECRET=f87e...[REDACTED]
```

There are two compose configs which can be used: `docker-compose` (default) and `docker-compose-full-build`. 

The default configuration, ran with `docker-compose up -d`, requires that the reactjs project is built first. To do this, from within the `./client/` directory, run `npm install` and `npm run build`. This will compile the project into html which is then copied into the container.

The other compose configuration, ran with `docker-compose up --file docker-compose-full-build -d`, does not require any initial configuration but takes SIGNIFICANTLY longer to build. This is because the configuration will install and build the react app within the custom image, which takes a while (~10min on Macbook Pro).

## Docker Swarm Usage
*assuming 3 nodes - manager, worker1, worker2*

**Prepare files on nodes:**
* `docker-machine scp -r . manager:~/`
* `docker-machine scp -r . worker1:~/`
* `docker-machine scp -r . worker2:~/`


**Install compose on manager:**
* `manager> sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose`
* `manager> sudo chmod +x /usr/local/bin/docker-compose`
* `manager> sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose`

**Create temporary image registery:**

`manager> docker service create --name registry --publish published=5000,target=5000 registry:2`

**Build the custom image/s:**

`manager> docker-compose -f docker-compose-swarm.yml build`

**Push custom app images to registery:**

`manager> docker-compose -f docker-compose-swarm.yml push`

**Create network:**

`manager> docker network create --scope=swarm --driver=overlay   --subnet=172.22.0.0/16 --gateway=172.22.0.1 app-network`

**Compose Deploy:**
```
manager> 
SPOTIFY_CLIENT_ID=123c...[REDACTED] \
 SPOTIFY_CLIENT_SECRET=321b...[REDACTED] \
 docker stack deploy --compose-file docker-compose-swarm.yml mixo
```
