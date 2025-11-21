FROM node:18-slim

WORKDIR /usr/src/app

COPY supabase/functions/package.json supabase/functions/yarn.lock ./

RUN yarn install --frozen-lockfile

COPY supabase/functions/. .

CMD ["yarn", "start"]
