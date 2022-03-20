# Sam's Remix App!

- [Remix Docs](https://remix.run/docs)

## Required gobal packages

- sass: `yarn global add sass`
- prettier: `yarn global add prettier`

## Database

### Initial setup

1. Create: `npx prisma init --datasource-provider postgresql`
   - _edit prisma/schema.prisma and add a model_
2. Generate: `npx prisma generate`

### Maintenance

- Seed: `npx prisma db seed`
- Migrate: `npx prisma migrate dev`
- Reset: `npx prisma migrate reset`
- Re-create prisma schema based on DB: `npx prisma db push`
- Web admin panel: `npx prisma studio`

## Development

**Running concurrently**

```sh
npm run dev
```

**Running separately (in separate terminal windows)**

```sh
npm run sass:dev
remix watch
npm run serve:dev
```

## Deployment

**Running concurrently**

```sh
npm run start
```

**Running separately**

```sh
npm run sass
remix build
npm run serve
```
