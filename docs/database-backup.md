# Database backups (production)

Automated daily dumps of the `yippie_bot` database using the
[`nfrastack/db-backup`](https://nfrastack.com/db-backup) container next to the `db` service.
Not needed for development.

## Compose

Add this service to the production compose file (next to `db`). Pick a concrete version tag from the
[image registry](https://hub.docker.com/r/nfrastack/db-backup) instead of `latest`.

```yaml
  db-backup:
    restart: unless-stopped
    image: nfrastack/db-backup:<version>
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./db_backups:/backup
    environment:
      - TZ=Europe/Berlin
      - DB01_TYPE=mysql
      - DB01_HOST=db
      - DB01_NAME=yippie_bot
      - DB01_USER=fortus
      - DB01_PASS=...                 # same value as MYSQL_PASSWORD of the db service
      - DB01_BACKUP_BEGIN=0300        # first run at 03:00, then every interval
      - DB01_BACKUP_INTERVAL=1440     # minutes -> once a day
      - DB01_CLEANUP_TIME=20160       # minutes of backups to keep -> 14 days
      - DB01_COMPRESSION=GZ
      - DB01_CHECKSUM=SHA1
    networks:
      - yippie-network
```

Notes:
- The container runs as UID 10000, so `./db_backups` must be writable by it: `chown -R 10000:10000 ./db_backups`.
- It uses the normal DB user (`fortus`) instead of root. Only if a dump ever
  fails with an "access denied ... PROCESS privilege" error, grant it once:
  ```bash
  docker exec -it <db-container> mysql -uroot -p -e "GRANT PROCESS ON *.* TO 'fortus'@'%';"
  ```
- Backups land in `./db_backups` on the host. **Copy that folder off the machine** (NAS, cloud, second disk),
  otherwise a dead disk takes the backups with it.

## Check that it works

```bash
docker compose up -d db-backup
docker logs --tail 50 <db-backup-container>   # no errors, no "moved to a new location" banner
docker exec <db-backup-container> backup-now  # trigger a backup right away
ls -la db_backups                             # should contain a *.sql.gz file
```

If the file does not appear, the log of the `backup-now` run shows why (permissions, wrong password, missing
`PROCESS` privilege).

## Restore

Adjust the file name to your backup; the file type depends on the compression you chose.

```bash
gunzip < db_backups/<file>.sql.gz | docker exec -i <db-container> sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" yippie_bot'
```

Test a restore once on a spare database before you need it. Also take a manual backup before deploying a version
that contains new migrations.
