
        FROM node:latest as builder

        ENV PROJECT_ENV production
        ENV NODE_ENV production

        RUN git clone http://192.168.3.61:10080/taobao-fe/def-deploy-demo.git 

        WORKDIR /def-deploy-demo

        RUN git checkout daily/0.0.1 && npm config set registry https://registry.npm.taobao.org/ 
        RUN npm install --production && npm run build

        # 选择更小体积的基础镜像
        FROM nginx:alpine

        COPY --from=builder def-deploy-demo/dist /usr/share/nginx/html
        COPY --from=builder def-deploy-demo/nginx /etc/nginx/conf.d
        