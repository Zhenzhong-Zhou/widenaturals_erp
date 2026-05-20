# AWS Demo Deployment — WideNaturals ERP

End-to-end workflow for setting up an AWS account from zero and deploying the ERP demo (Node/Express + PostgreSQL + React + S3). Optimized for the post-July-2025 Free Tier ($200 credits, 6 months).

> **Cost expectation:** with EC2 stopped when not demoing, this whole setup runs ~$3–8/month from your credits. The credit-burners are EC2 running 24/7 (~$8–10/mo), NAT Gateways (~$33/mo — don't use one), and unattached Elastic IPs. S3 is effectively free at this scale (~$0.05/mo).

---

## Phase 0 — Pre-flight

Before clicking anything on AWS:

- [ ] Decide region. **Pick one and stay in it** — multi-region usage silently doubles consumption. Reasonable choices for a Vancouver-based dev:
    - `us-east-2` (Ohio) — **cheapest**, t3.micro ~$7.50/mo (chosen for this demo)
    - `us-west-2` (Oregon) — same price as Ohio, lower latency from Vancouver
    - `ca-west-1` (Calgary) — ~$8.50/mo (~$1/mo more), Canadian data residency, lowest latency from Vancouver
    - `ca-central-1` (Montreal) — ~$8.50/mo, Canadian data residency, higher latency
      See **Decisions log** at the end of this doc for the rationale of the choice made.
- [ ] Decide domain strategy (real domain → real SSL via Let's Encrypt; IP-only → self-signed or skip HTTPS for demo).
- [ ] Have a password manager ready (you'll generate IAM creds you must not lose).
- [ ] `.gitignore` includes `.env*` (verify before going further).

---

## Phase 1 — Account creation & root hardening

1. Sign up at https://aws.amazon.com → choose **Free account plan**.
2. The signup flow gives $100 credits immediately. You earn up to $100 more by completing 5 tasks ($20 each): launch EC2, configure RDS, build Lambda, use Bedrock, **set up a Budget**. We'll do the Budget one in Phase 2 for $20 + safety.
3. **Enable MFA on the root account immediately.** Console → IAM → Security credentials → Assign MFA device (use an authenticator app, not SMS).
4. **Lock the root account away.** After Phase 3 you should never log in as root again except for billing / account closure.

---

## Phase 2 — Billing protection (do this BEFORE any service)

Skipping this is how people get $400 surprise bills. **Create TWO budgets**, not one — they catch different failure modes.

### Budget 1: Zero Spend (catches the moment credits run out)

1. Console → **Billing and Cost Management** → **Budgets** → Create budget.
2. **Use a template (simplified)** → **Zero spend budget**.
3. Budget name: `widenaturals-erp-zero-spend`.
4. Email recipients: your email.
5. Scope: All AWS services (default).
6. Create. Fires when any post-credit spend > $0.01.

### Budget 2: Monthly $50 (graduated warning during normal use)

1. Budgets → Create budget again.
2. **Use a template (simplified)** → **Monthly cost budget**.
3. Budget name: `widenaturals-erp-monthly-50`.
4. Budget amount: `$50` (or your ceiling).
5. Email recipients: your email.
6. Create. Template auto-creates alerts at **85% of actual** and **100% of forecasted** spend.

### Then enable Free Tier alerts

Console → Billing preferences → enable:
- Receive Free Tier usage alerts
- Receive PDF invoices by email

### Why two budgets?

| Budget | Fires when | Catches |
|---|---|---|
| Zero Spend | Any non-credit spend > $0.01 | Moment credits run out, or a non-credit-eligible service is used |
| Monthly $50 | Actual > $42.50 OR forecasted > $50 | Runaway usage building up within the credit window |

### Optional — paranoid circuit breaker

Console → Budgets → Budget Actions → at 100% threshold, attach an IAM policy that denies `ec2:*` and `rds:*` to all users. Manual to set up but acts as a real circuit breaker.

> **No, AWS does not let you set a hard "stop spending" cap.** Alerts + Budget Actions are the closest thing. Watch your inbox.

---

## Phase 3 — IAM admin user (stop using root)

1. Console → IAM → Users → Create user → username `bob-admin` (or whatever).
2. Console access: yes, custom password.
3. Permissions: attach managed policy `AdministratorAccess` for now (you can scope down later).
4. Create user → save the sign-in URL (looks like `https://<account-id>.signin.aws.amazon.com/console`).
5. **Enable MFA on this user too.**
6. Log out of root, log in as `bob-admin`. Use this user for everything from here on.

---

## Phase 4 — Dev IAM user for S3 (scoped, programmatic)

This user is what your **local dev machine** uses to talk to S3. Least-privilege.

1. IAM → Users → Create user → `widenaturals-erp-dev`.
2. **No console access**, programmatic only.
3. Permissions → Attach policies directly → **Create policy** with this JSON (replace bucket names as needed):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::widenaturals-erp-dev-images",
      "arn:aws:s3:::widenaturals-erp-dev-images/*",
      "arn:aws:s3:::widenaturals-erp-dev-backups",
      "arn:aws:s3:::widenaturals-erp-dev-backups/*",
      "arn:aws:s3:::widenaturals-erp-dev-logs",
      "arn:aws:s3:::widenaturals-erp-dev-logs/*"
    ]
  }]
}
```

4. Name the policy `widenaturals-erp-dev-s3-access`, attach it to the user.
5. Create user → **Create access key** → Use case "Application running outside AWS" → save the Access Key ID + Secret Access Key. **This is the only time the secret is shown.**

Repeat the same pattern later for `widenaturals-erp-prod` (Phase 10) with `prod` bucket names.

---

## Phase 5 — Create S3 buckets (dev set)

Three buckets per environment, separated by concern. Different access patterns → different lifecycle rules.

| Bucket | Purpose | Lifecycle |
|---|---|---|
| `widenaturals-erp-dev-images` | SKU/product images, served via presigned URLs | Standard, no rules |
| `widenaturals-erp-dev-backups` | nightly `pg_dump` files | → Standard-IA at 30d, delete at 90d |
| `widenaturals-erp-dev-logs` | rotated app/nginx logs | → Standard-IA at 30d, delete at 60d |

For each bucket:

1. S3 console → Create bucket → name → region `us-west-2`.
2. **Block all public access: ON** (all four checkboxes). You'll serve images via presigned URLs.
3. Bucket versioning: off for dev (saves cost). On for prod.
4. For `backups` and `logs`: → Management tab → Lifecycle rules → add the transitions/expirations from the table above.

---

## Phase 6 — Local S3 integration

Wire the SDK into the backend on your dev machine. **Do not touch EC2 yet.**

1. Install SDK:
   ```bash
   npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```
2. `.env.development` (gitignored):
   ```
   AWS_REGION=us-west-2
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_IMAGES_BUCKET=widenaturals-erp-dev-images
   AWS_S3_BACKUPS_BUCKET=widenaturals-erp-dev-backups
   AWS_S3_LOGS_BUCKET=widenaturals-erp-dev-logs
   ```
3. Write a one-off smoke script `scripts/test-s3.js`:
    - list bucket → upload `test.txt` → generate presigned GET URL → fetch it → delete it.
    - If all four succeed, S3 wiring is correct.
4. Build per-concern services following project conventions:
   ```
   server/src/services/
     s3-image-service.js
     s3-backup-service.js
     s3-log-archive-service.js
   ```
   Shared S3 client in `server/src/config/s3-client.js`. Each service: own context string, bucket pulled from env, error handling via `handleDbError`-style wrapper (use a new `handleS3Error` helper).

---

## Phase 7 — Seed file strategy

Split seeds before deploying. You almost certainly don't want all dev seeds running in prod.

```
server/src/database/seeds/
  reference/      ← always idempotent: statuses, permissions, warehouses, lot_adjustment_types
  demo/           ← one-time demo data: sample company, demo users, sample SKUs
```

Decisions for image-bearing seeds:
- **Reference seeds:** no S3 involvement, leave alone.
- **Demo SKU seeds:** insert rows with `image_url = NULL`, upload images manually through the app after the demo seed runs. Less fragile than scripting image uploads inside seeds.
- New seeds you'll need: a demo company, demo admin user, demo warehouse so first-login has something to show.

After Phase 6 is solid, run seeds locally and verify:
- log in → upload SKU image → image lands in `widenaturals-erp-dev-images` → URL renders in frontend.

If that full loop works, EC2 deploy is mechanical.

---

## Phase 8 — Launch EC2

1. EC2 console → **Launch instance**.
2. **Name:** `widenaturals_erp_demo`.
3. **AMI:** Ubuntu Server LTS (24.04 or newer, e.g. 26.04) — **Free tier eligible** label confirms it.
4. **Architecture:** 64-bit x86 (avoid ARM/`t4g` for the demo; some npm native modules and Docker images don't ship for ARM).
5. **Instance type:** `t3.micro` (1 GB RAM, 2 vCPU). Tight but adequate for demo if you run native (no Docker).
6. **Key pair → Create new key pair:**
    - Name: `widenaturals-erp-demo`
    - Type: **RSA** (more universally compatible than ED25519)
    - Format: **`.pem`** (for Mac/Linux SSH; `.ppk` is PuTTY/Windows only)
    - Download triggers automatically — this is the **only time** the private key is shown
    - **Immediately on download:**
      ```bash
      mkdir -p ~/.ssh
      mv ~/Downloads/widenaturals-erp-demo.pem ~/.ssh/
      chmod 400 ~/.ssh/widenaturals-erp-demo.pem
      ```
      SSH refuses to use key files readable by other users — the `chmod 400` is mandatory.
7. **Network settings → Edit:**
    - Default VPC, public subnet, **Auto-assign public IP: enable**.
    - **No NAT Gateway.** ($33/mo trap.)
    - Security group: create new, name `widenaturals-erp-demo-sg`:
        - SSH (22) → source: **My IP** only (not 0.0.0.0/0 — the AWS warning is real)
        - HTTP (80) → 0.0.0.0/0 (needed for Let's Encrypt validation + Nginx)
        - HTTPS (443) → 0.0.0.0/0
        - **Do not** open 5432 (Postgres) or your Node port (e.g. 5000). Keep them internal.
8. **Configure storage → Advanced:**
    - **Size: 20 GiB** (NOT the 8 GiB default). 8 GB fills up fast once you have Ubuntu + apt updates + node_modules + Postgres data + logs. ~$1.60/mo for 20 GB vs $0.64 for 8 GB — worth it.
    - Volume type: **gp3** (cheaper per GB than gp2, free tier eligible)
    - **Encrypted: Yes**, KMS key: `(default) aws/ebs`. Encryption is free, no perf impact, defense in depth.
    - Throughput: 125 (gp3 default, fine)
    - Delete on termination: Yes (for clean teardown — no orphaned EBS bills)
9. **Advanced details — the non-obvious gotchas:**
    - **Credit specification: `Standard`** ← **CRITICAL**. AWS defaults to `Unlimited`, which silently bills $0.05/vCPU-hour when the instance bursts past baseline credits. A runaway process can rack up $20+/day. Standard caps CPU at baseline when credits exhaust — no surprise bill.
    - **Shutdown behavior: `Stop`** (NOT `Terminate`). If set to Terminate, running `sudo shutdown -h now` from inside the box destroys the instance + volume.
    - **Metadata version: `V2 only (token required)`** (IMDSv2). More secure than V1; default is correct, keep it.
    - **EBS-optimized: Enable** (default, good).
    - Termination protection: leave off (makes teardown easier for a demo).
    - Detailed CloudWatch monitoring: leave off (basic is free; detailed adds ~$2.10/instance/mo).
    - IAM instance profile: leave empty for now (we use access keys in `.env.production`; can switch to instance profile later as a security upgrade).
10. Click **Launch instance**.
11. **Within 5 minutes of launch**, allocate + associate an Elastic IP:
    - EC2 → **Elastic IPs** → **Allocate Elastic IP address**
    - Add a name tag (e.g. `widenaturals-erp-demo-eip`) so it's findable later
    - Click Allocate
    - Select the new EIP → **Actions** → **Associate Elastic IP address**
    - Resource type: **Instance** → pick `widenaturals_erp_demo`
    - Private IP: auto-fills (only one option)
    - **`Allow this Elastic IP address to be reassociated`: LEAVE UNCHECKED.** Default unchecked is safer — it requires manual disassociation before moving the EIP, preventing accidental remaps.
    - Click Associate
    - **Save the EIP address** — that's your permanent SSH endpoint. EIPs are free while attached, ~$3.60/mo if unattached.

---

## Phase 9 — Provision the server

SSH in:
```bash
ssh -i widenaturals-erp.pem ubuntu@<elastic-ip>
```

Install everything natively (no Docker — 1 GB RAM is too tight):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git postgresql postgresql-contrib nginx certbot python3-certbot-nginx ufw
# Node 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
pm2 install pm2-logrotate
```

Firewall (defense in depth on top of the SG):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

PostgreSQL setup:
```bash
sudo -u postgres psql
```
```sql
CREATE USER widenaturals_app WITH PASSWORD '<strong-password>';
CREATE DATABASE widenaturals_erp OWNER widenaturals_app;
\q
```

Run your Knex migrations:
```bash
cd ~/widenaturals-erp
git clone <your-repo> .   # or via deploy key
cd server
npm ci
NODE_ENV=production npx knex migrate:latest
NODE_ENV=production npx knex seed:run --specific=reference   # only reference seeds in prod
NODE_ENV=production npx knex seed:run --specific=demo        # run ONCE for the demo
```

`.env.production` on the box (chmod 600, never commit):
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://widenaturals_app:<pw>@localhost:5432/widenaturals_erp
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA...           # prod IAM user, NOT dev
AWS_SECRET_ACCESS_KEY=...
AWS_S3_IMAGES_BUCKET=widenaturals-erp-prod-images
AWS_S3_BACKUPS_BUCKET=widenaturals-erp-prod-backups
AWS_S3_LOGS_BUCKET=widenaturals-erp-prod-logs
SESSION_SECRET=...
JWT_SECRET=...
```

Start with PM2:
```bash
pm2 start npm --name widenaturals-api -- run start
pm2 save
pm2 startup     # run the printed command, survives reboot
```

Nginx reverse proxy `/etc/nginx/sites-available/widenaturals`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;   # or _ for IP-only

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/widenaturals /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

SSL (only if you have a real domain pointing at the Elastic IP):
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## Phase 10 — Production IAM + S3 buckets

Repeat Phases 4 and 5 with `prod` names: `widenaturals-erp-prod-{images,backups,logs}` and IAM user `widenaturals-erp-prod` with a policy scoped to those three buckets only.

**Never share credentials between dev and prod.** A `s3.deleteObject` in a dev test should never be able to touch prod data.

---

## Phase 11 — Frontend deploy

On your local machine:
```bash
cd client
# Set API URL in .env.production
echo "VITE_API_URL=https://api.yourdomain.com" > .env.production
npm run build
```

Two options for hosting the static build:

**Option A: S3 static website hosting (simplest, HTTP only)**
1. Create bucket `widenaturals-erp-prod-frontend`, region same as everything else.
2. Properties → Static website hosting → enable, index doc `index.html`, error doc `index.html` (for SPA routing).
3. Permissions → **uncheck Block all public access** (this bucket IS public).
4. Add bucket policy granting public read:
   ```json
   {
     "Version":"2012-10-17",
     "Statement":[{
       "Sid":"PublicRead",
       "Effect":"Allow",
       "Principal":"*",
       "Action":"s3:GetObject",
       "Resource":"arn:aws:s3:::widenaturals-erp-prod-frontend/*"
     }]
   }
   ```
5. Upload `dist/` contents (AWS CLI: `aws s3 sync dist/ s3://widenaturals-erp-prod-frontend --delete`).

**Option B: S3 + CloudFront (HTTPS, CDN, recommended even for demo)**
1. Bucket stays private (Block all public access ON).
2. Create CloudFront distribution → Origin = the S3 bucket → Origin Access Control auto-attaches.
3. Default root object: `index.html`. SPA error pages: 403 + 404 → `/index.html` with HTTP 200.
4. Request an ACM certificate in **us-east-1** (CloudFront requirement) for your frontend domain, attach.
5. Point your DNS at the CloudFront distribution.

CORS on the backend — update Express CORS to allow the frontend origin (`https://yourdomain.com` or the CloudFront URL). If using cookie auth, set `SameSite=None; Secure` and configure `credentials: true` on both sides.

---

## Phase 12 — Backups & log archival

**Nightly Postgres backup → S3** (`/etc/cron.daily/widenaturals-backup`, mode 755):
```bash
#!/bin/bash
set -euo pipefail
BUCKET=widenaturals-erp-prod-backups
TS=$(date -u +%Y%m%dT%H%M%SZ)
sudo -u postgres pg_dump widenaturals_erp \
  | gzip \
  | aws s3 cp - "s3://${BUCKET}/pg/${TS}.sql.gz"
```
The lifecycle rule from Phase 5 handles expiration. Test by running it manually once.

**Log archival** — `pm2-logrotate` already rotates PM2 logs daily. For shipping rotated files to S3, a similar cron:
```bash
aws s3 sync /home/ubuntu/.pm2/logs/ s3://widenaturals-erp-prod-logs/pm2/ \
  --exclude "*-out.log" --exclude "*-error.log"   # only rotated/gzipped files
```

For nginx access logs same pattern, source `/var/log/nginx/`.

> Don't try to stream runtime logs to S3 — that's not what S3 is for. Use CloudWatch Logs if you ever need live tailing.

---

## Operational checklists

**Daily (during demo period):**
- Check Budget email — any alerts?
- `pm2 status` — API healthy?

**Weekly:**
- Verify backup landed in S3: `aws s3 ls s3://widenaturals-erp-prod-backups/pg/ | tail`
- `df -h` on EC2 — is the 20 GB volume filling up? (alert at >80%)

**When not actively demoing:**
- **Stop the EC2 instance** (don't terminate). Stopped = no compute charges, only ~$1.60/mo for the 20 GB EBS volume.
- Keep the Elastic IP attached (still free while attached to a stopped instance).

**Teardown (when demo period ends):**
- [ ] Terminate EC2 instance
- [ ] Delete EBS volumes (sometimes not auto-deleted)
- [ ] Release Elastic IP
- [ ] Empty + delete S3 buckets (or keep with lifecycle to Glacier — pennies)
- [ ] Delete CloudFront distribution if used
- [ ] Delete IAM users + access keys
- [ ] Revoke the budget — actually leave it as a tripwire even on a "dead" account

---

## Cost reference (rough, us-east-2, after credits exhausted)

| Resource | Cost/month |
|---|---|
| EC2 t3.micro 24/7 | ~$7.50 |
| EC2 t3.micro stopped (EBS only, 20 GB gp3) | ~$1.60 |
| Elastic IP (attached) | $0 |
| Elastic IP (unattached) | ~$3.60 |
| EBS gp3 20 GiB (running or stopped) | ~$1.60 |
| S3 Standard (5 GB images + backups) | ~$0.12 |
| Data transfer out (1 GB) | ~$0.09 |
| **NAT Gateway** | **~$33** ← don't use one |
| Route 53 hosted zone (if you use one) | $0.50 |

Canadian regions (ca-central-1 Montreal, ca-west-1 Calgary) add ~10% across the board.

---

## Gotchas (the actual reasons people get surprise bills)

- **NAT Gateways.** Never provision one for a demo. ~$33/mo flat plus per-GB.
- **`Credit specification: Unlimited`** on t-class instances. **AWS defaults to Unlimited at launch.** When CPU credits exhaust, the instance keeps bursting and bills $0.05/vCPU-hour for surplus. A runaway process or unexpected traffic spike = silent overage. **Always set to `Standard` for demos.**
- **Unattached Elastic IPs.** Release them when not in use. Free while attached, ~$3.60/mo if not.
- **Orphaned EBS volumes.** Terminating an instance does not always delete the volume — verify `Delete on termination: Yes` was set at launch, otherwise the volume keeps billing.
- **Forgotten regions.** A test resource in `eu-west-1` will bill silently. Pick one region and stick to it.
- **Public S3 buckets.** Only `*-frontend` should be public; never the images/backups/logs buckets.
- **Same credentials in dev and prod.** A dev script can wipe prod data. Always two IAM users, scoped policies per env.
- **Committing `.env*`.** Audit `git log` and `.gitignore` before pushing.
- **Joining an AWS Organization** — Free Tier credits expire immediately if your account joins an Org. Don't do this until credits are spent.
- **Losing the `.pem` private key.** AWS only shows it once at key pair creation. If you lose it, you cannot recover access — you'd have to terminate the instance and start over. Back it up in a password manager.

---

## Sequencing recap

```
Phase 1-3   Account + MFA + IAM admin       ┐
Phase 2     Budget alerts ($20 credit too)  │ before any service
Phase 4-5   Dev IAM + dev S3 buckets        │
                                            │
Phase 6     Local S3 integration            │ all local
Phase 7     Seed file split + adjustment    │
                                            ┘
Phase 8-9   EC2 launch + provisioning       ┐
Phase 10    Prod IAM + prod S3 buckets      │ deploy
Phase 11    Frontend to S3/CloudFront       │
Phase 12    Backups + log archival cron     ┘

Operational: stop EC2 when not demoing. Tear down fully when done.
```

---

## Decisions log

Why we made each choice during initial setup. When something needs to change later, start here to understand what trade-offs the current setup is making.

### Region: `us-east-2` (Ohio)
- **Considered:** us-east-2 ($7.50/mo), us-west-2 ($7.50/mo), ca-west-1 Calgary ($8.50/mo), ca-central-1 Montreal ($8.50/mo).
- **Chose us-east-2** for lowest cost on a $200 credit budget.
- **Switch to `ca-west-1` (Calgary)** later if real customer data triggers Canadian data residency requirements. Calgary > Montreal for a Vancouver-based dev (lower latency, same price).

### Instance type: `t3.micro` (x86)
- **Considered:** t3.micro x86 ($7.50/mo), t4g.micro ARM/Graviton ($6.05/mo), t2.micro old-gen ($8.50/mo).
- **Chose t3.micro** over the cheaper t4g.micro because some npm packages with native bindings and some Docker images don't ship for ARM yet. The ~$1.50/mo savings isn't worth a compatibility surprise.

### Credit specification: `Standard`
- **AWS default: `Unlimited`** — would silently charge $0.05/vCPU-hour for sustained CPU burst past baseline credits. A runaway `npm install` loop or a traffic spike could quietly add $20+ in a day.
- **Standard caps CPU at baseline** (10% on t3.micro) when credits exhaust. No surprise bill, just degraded performance until credits recover.
- For demo workloads: always Standard.

### Storage: `20 GiB gp3`, encrypted, delete-on-termination
- **AWS default: `8 GiB`** — too tight. Realistic usage: Ubuntu base + apt updates (~5 GB) + node_modules + Postgres data + logs leaves <2 GB free on day one.
- **Chose 20 GiB** for headroom. Cost diff: ~$1/mo. Worth not having to expand volumes mid-demo.
- **gp3 over gp2**: cheaper per GB, same performance for this workload.
- **Encrypted: Yes**: free, no perf impact, defense in depth.
- **Delete on termination: Yes**: prevents orphaned EBS bills on teardown.

### Shutdown behavior: `Stop`
- **Considered:** Stop (default) vs Terminate.
- **Stop** means `sudo shutdown -h now` inside the box halts it but preserves the instance + volume.
- **Terminate** would destroy the instance + volume on OS-level shutdown — catastrophic for a server you didn't intend to destroy.

### Metadata version: `V2 only (token required)` (IMDSv2)
- **Chose V2 only** for security: IMDSv2 requires a session token, preventing SSRF-style attacks from stealing instance credentials.
- This is the AWS-recommended default; keep it.

### Key pair: RSA, `.pem` format
- **Considered:** RSA vs ED25519, `.pem` vs `.ppk`.
- **RSA**: universally compatible with older SSH clients, CI tools, automation. ED25519 is more modern but offers no practical benefit for this workflow.
- **`.pem`**: standard OpenSSH format, works natively on Mac/Linux. `.ppk` is PuTTY-only (Windows).
- **`chmod 400` ritual**: SSH refuses to use a key file readable by other users. Done immediately on download.

### Elastic IP reassociation: unchecked
- **AWS default: unchecked.** Kept the default.
- Unchecked = EIP cannot be moved to another instance without first manually disassociating it. Safer; prevents accidental remapping.
- Only check this if you have an automation that needs to atomically move an EIP between instances.

### Two budgets, not one: Zero Spend + Monthly $50
- **Considered:** single $50 monthly budget with 50/80/100% alerts.
- **Chose two budgets** because they catch different failure modes:
    - Zero Spend fires at $0.01 actual spend → tells you the moment credits run out (paid mode silently engaged).
    - Monthly $50 fires at 85% actual / 100% forecasted → graduated warning during normal use.
- A single budget at $50 wouldn't tell you you've moved from "covered by credits" to "paying real money" until ~$42 of real spend had accumulated.

### Docker: not used (run everything native)
- **Considered:** Docker Compose with three containers (Node, Postgres, frontend build).
- **Chose native install** because t3.micro has only 1 GB RAM. Docker daemon + three containers = constant OOM pressure.
- Plan to dockerize later when moving to a paid instance with ≥4 GB RAM.

### PostgreSQL: on EC2 (same box), not RDS
- **Considered:** RDS db.t3.micro vs Postgres native on the EC2 instance.
- **Chose native EC2** because RDS db.t3.micro would burn through the $200 credits roughly twice as fast as just running Postgres on the existing instance.
- Acceptable for a demo with low traffic. Move to RDS once paid plan + real users + need for managed backups/HA.

### Backups go to S3 via nightly cron, not RDS snapshots
- Native Postgres means no automatic snapshot mechanism — must script it.
- Nightly `pg_dump | gzip | aws s3 cp` to `widenaturals-erp-prod-backups` is reliable and cheap (<$0.10/mo for the bucket itself).
- Lifecycle rule transitions backups to Standard-IA at 30d, deletes at 90d.

### Lifecycle storage class: Standard-IA over Glacier IR
- **Considered:** Glacier Instant Retrieval (~$0.004/GB/mo) vs Standard-IA (~$0.0125/GB/mo).
- **Glacier IR has a 90-day minimum storage duration.** With a 30-day transition + 90-day expiration, objects only live 60 days in Glacier IR — AWS still bills for the missing 30 days as an early deletion fee.
- **Standard-IA has a 30-day minimum** — aligned with the transition timing, no penalty.
- Standard-IA costs ~2x more per GB than Glacier IR but with zero edge cases. At demo scale (<1 GB of backups), the absolute difference is fractions of a cent per month. Cognitive simplicity wins.
- Same logic applies to the logs bucket (30d transition — Standard-IA's pre-transition minimum, 60d expire).
