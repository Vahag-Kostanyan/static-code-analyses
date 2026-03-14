FROM node
WORKDIR /app
COPY /src/index.js /app/src/index.js
ENTRYPOINT ["node", "/src/index.js"]