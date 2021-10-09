# Localhost Proxy
This is a simple proxy tool such that `http://localhost` can be used instead on a swarm node's IP address. This allows for the youtube and spotify SDKs to function.

To use the proxy, just change the IP address in the `nginx.ini` file to point to a swarm node's IP address. Then fire it up with `docker-compose up -d`.