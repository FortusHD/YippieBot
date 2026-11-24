# Database backups (production)

Automated daily dumps of the `yippie_bot` database using the
[`tiredofit/db-backup`](https://github.com/tiredofit/docker-db-backup) container next to the `db` service.
Not needed for development.

## Compose

Add this service to the production `docker-compose.yml` (next to `db`). Pin the image to a concrete version tag
instead of `latest` once you have picked one.

```yaml
  db-backup:
    restart: unless-stopped
    image: tiredofit/db-backup:latest
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./db_backups:/backup
    environment:
      - TZ=Europe/Berlin
      - CONTAINER_ENABLE_MONITORING=FALSE
      - DEFAULT_COMPRESSION=GZ
      - DB01_TYPE=mysql
      - DB01_HOST=db
      - DB01_NAME=yippie_bot
      - DB01_USER=fortus
      - DB01_PASS=${MYSQL_PASSWORD}   # same value as MYSQL_PASSWORD of the db service
      - DB01_BACKUP_BEGIN=0300        # first run at 03:00, then every interval
      - DB01_BACKUP_INTERVAL=1440     # minutes -> once a day
      - DB01_CLEANUP_TIME=20160       # minutes -> delete backups older than 14 days
      - DB01_CHECKSUM=SHA1
      - DB01_EXTRA_BACKUP_OPTS=--single-transaction --no-tablespaces
    networks:
      - yippie-network
```

Notes:
- It uses the normal DB user (`fortus`), which owns `yippie_bot`, so the root password is not needed.
  `--no-tablespaces` avoids a MySQL 8 error because that user has no `PROCESS` privilege.
- Put the password into an `.env` file next to the compose file (`MYSQL_PASSWORD=...`) or paste it directly.
- Backups land in `./db_backups` on the host. **Copy that folder off the machine** (NAS, cloud, second disk),
  otherwise a dead disk takes the backups with it. The image can also upload to S3 (`DB01_BACKUP_LOCATION=S3`).

## Check that it works

```bash
docker compose up -d db-backup
docker compose exec db-backup backup-now   # trigger a backup right away
ls db_backups                              # should contain mysql_yippie_bot_*.sql.gz
```

## Restore

```bash
gunzip < db_backups/<file>.sql.gz | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" yippie_bot'
```

Test a restore once on a spare database before you need it. Also take a manual backup before deploying a version
that contains new migrations.
