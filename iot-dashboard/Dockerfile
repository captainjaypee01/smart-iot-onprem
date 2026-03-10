FROM node:22-alpine

WORKDIR /app

# install deps first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# copy project
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]