
    FROM node:20-alpine as builder

    WORKDIR /app

    COPY package.json .
    COPY package-lock.json .
    

    RUN npm install
    
 
    COPY . .
    RUN npm run build # Assumes your package.json has a 'build' script that outputs to 'dist'
    

    FROM nginx:alpine

    COPY nginx.conf /etc/nginx/conf.d/default.conf
    

    COPY --from=builder /app/dist /usr/share/nginx/html
    
 
    CMD ["nginx", "-g", "daemon off;"]