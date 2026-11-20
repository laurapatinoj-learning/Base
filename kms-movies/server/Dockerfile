FROM node:22-alpine
WORKDIR /app
COPY package.json server.js questions.js ./
COPY public ./public
ENV PORT=3000
EXPOSE 3000
USER node
HEALTHCHECK CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "server.js"]
