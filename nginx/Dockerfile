FROM nginx:stable-alpine

ENV PORT=8080 \
    API_HOST=api.microservice.yellhtut.com \
    API_PORT=4000 \
    FRONTEND_HOST=frontend.microservice.yellhtut.com \
    FRONTEND_PORT=3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
