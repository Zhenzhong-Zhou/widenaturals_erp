# Redis

This document describes how Redis is installed, configured, and operated
for the WIDE Naturals ERP system.

## Scope

Redis is required in all environments.
Local development typically uses a local Redis instance.
Staging and production may use managed or secured Redis services.

## Local Development

#### macOS (Homebrew)
```bash
  brew install redis
  brew install redis
  brew services start redis
```

#### Ubuntu / Debian
```bash
    sudo apt update
    sudo apt install redis-server
    sudo systemctl start redis
```

#### Verify
```bash
redis-cli ping
```

## Managing the Redis Service
#### macOS
```bash
brew services stop redis
``` 
#### Ubuntu / Debian
```bash
sudo systemctl stop redis
```

## Secured / Production Redis
> These steps apply to staging and production environments only.
> Local development does not require Redis authentication by default.

### Configuration Files

- `/etc/redis/redis.conf`
- `/opt/homebrew/etc/redis.conf`

### Authentication & ACLs

```bash
user myuser on >my_secure_password ~* +@all
```

## Connecting to Redis

```bash
redis-cli
AUTH your_secure_password
```
