## PostgreSQL Authentication with .pgpass

The `.pgpass` file allows PostgreSQL tools to authenticate without
interactive password prompts.

This is commonly used for:
- backups (`pg_dump`)
- restores (`pg_restore`)
- scheduled jobs
- CI/CD pipelines

### Security Considerations

- `.pgpass` must be readable **only** by the owning user
- Credentials stored here must be treated as sensitive
- Never commit `.pgpass` to version control

---

### Create the `.pgpass` File

Create or edit the file:

```bash
nano ~/.pgpass
```
Add credentials using the format:
```text
hostname:port:database:username:password
```
Example:
```text
localhost:5432:widenaturals_erp_production:db_user:strong_password_here
```
Apply strict permissions (required by PostgreSQL):
```text
chmod 600 ~/.pgpass
```
PostgreSQL tools will refuse to use this file if permissions are too open.


