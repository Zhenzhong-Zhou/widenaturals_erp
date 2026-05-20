# AWS Initial Setup Runbook — WideNaturals ERP

> ⚠️ **UI may have changed.** Last verified: **2026-05-19**.
> AWS redesigns the console roughly yearly. Button names, layouts, and default values shift.
> For durable strategy and decision rationale, see `aws-demo-deployment.md` — this runbook is a one-time walkthrough, the strategy doc is the long-term reference.

This runbook captures the actual click-by-click sequence used to set up the AWS account, launch EC2, and configure billing for the WideNaturals ERP demo on 2026-05-19. Use it as a memory aid if you ever need to redo this from scratch in a different region or account.

For the **why** behind each decision, see the **Decisions log** section at the end of `aws-demo-deployment.md`.

---

## Prerequisites

- Email address and credit card for the AWS root account
- Password manager open and ready
- Authenticator app installed (Google Authenticator, 1Password, Authy, etc.)
- Mac/Linux terminal access

---

## 1. Create AWS account

1. Visit https://aws.amazon.com → **Create an AWS Account**
2. Choose **Free account plan** ($100 immediate + up to $100 from onboarding tasks, 6 months)
3. Verify email, enter payment info (won't be charged on free plan)
4. Sign in to console

---

## 2. Secure the root account (do BEFORE anything else)

1. Top-right user menu → **Security credentials**
2. Multi-factor authentication (MFA) → **Assign MFA device**
    - Device name: `root-mfa`
    - MFA device: **Authenticator app**
    - Scan QR with authenticator app, enter 2 consecutive codes → Add MFA
3. Log out, log back in to confirm MFA prompt works

**From here, do not log in as root again** except for billing/account closure.

---

## 3. Set region

Top-right region dropdown (next to your account name) → pick your region.

For this demo: **US East (Ohio) us-east-2** was chosen.

> Why us-east-2: cheapest tier ($7.50/mo for t3.micro). See decisions log in main doc for the full comparison.

**Stay in this region for ALL resources from now on.** Cross-region transfers cost real money.

---

## 4. Allocate Elastic IP

Skip ahead — we'll do this right after launching EC2 (step 7). Coming back here for completeness later.

---

## 5. Budgets (do BEFORE launching any service)

Search bar (top of console) → **Budgets** → **Create budget**.

### Budget 1: Zero Spend

1. **Use a template (simplified)** ✓
2. Template: **Zero spend budget**
3. Budget name: `widenaturals-erp-zero-spend`
4. Email recipients: your email
5. Scope: All AWS services (default)
6. **Create budget**

### Budget 2: Monthly $50

1. Budgets → **Create budget** again
2. **Use a template (simplified)** ✓
3. Template: **Monthly cost budget**
4. Budget name: `widenaturals-erp-monthly-50`
5. Budget amount: `$50`
6. Email recipients: your email
7. **Create budget**

### Enable Free Tier alerts

Billing and Cost Management → **Billing preferences** → enable:
- Receive Free Tier usage alerts
- Receive PDF invoices by email

---

## 6. Launch EC2 instance

EC2 console → **Launch instance**.

### Name and tags
- Name: `widenaturals_erp_demo`

### Application and OS Images
- Quick Start: **Ubuntu**
- AMI: **Ubuntu Server 26.04 LTS** (or latest LTS marked "Free tier eligible")
- Architecture: **64-bit (x86)**

### Instance type
- **t3.micro** (2 vCPU, 1 GiB Memory)

### Key pair (login)
- **Create new key pair**
    - Key pair name: `widenaturals-erp-demo`
    - Key pair type: **RSA**
    - Private key file format: **.pem**
- Click **Create key pair** → browser downloads `widenaturals-erp-demo.pem`

**Immediately in terminal:**
```bash
mkdir -p ~/.ssh
mv ~/Downloads/widenaturals-erp-demo.pem ~/.ssh/
chmod 400 ~/.ssh/widenaturals-erp-demo.pem
ls -la ~/.ssh/widenaturals-erp-demo.pem   # verify: -r--------
```

### Network settings → Edit
- VPC: default
- Subnet: No preference (Default subnet in any availability zone)
- Auto-assign public IP: **Enable**
- Firewall (security group): **Create security group**
    - Security group name: `widenaturals-erp-demo-sg` (rename from default `launch-wizard-1`)
    - Description: `widenaturals-erp-demo-sg`
- Inbound rules:
    - SSH (22) — source: **My IP**
    - HTTPS (443) — source: **Anywhere (0.0.0.0/0)** (check the box)
    - HTTP (80) — source: **Anywhere (0.0.0.0/0)** (check the box)

### Configure storage → Advanced
- **Size: 20 GiB** (change from default 8)
- Volume type: **gp3** (Free tier eligible)
- IOPS: 3000 (default)
- Delete on termination: **Yes**
- **Encrypted: Encrypted**
- KMS key: **(default) aws/ebs**
- Throughput: 125 (default)

### Advanced details (expand)
- **Credit specification: `Standard`** ← change from default `Unlimited` ⚠️
- **Shutdown behavior: `Stop`** (verify — should be default)
- Metadata version: **V2 only (token required)** (default — keep)
- EBS-optimized: **Enable** (default — keep)
- Detailed CloudWatch monitoring: leave empty
- Termination protection: leave empty
- IAM instance profile: leave empty (using access keys for now)
- Everything else: leave defaults

### Summary panel (right side, verify)
- Number of instances: 1
- Software Image: Ubuntu 26.04 (or whichever LTS)
- Virtual server type: t3.micro
- Firewall: New security group
- Storage: 1 volume - 20 GiB

Click **Launch instance**.

---

## 7. Allocate + associate Elastic IP

While instance is starting (~30 seconds):

### Allocate
1. EC2 sidebar → **Elastic IPs** (under Network & Security)
2. Top right → **Allocate Elastic IP address**
3. Public IPv4 address pool: **Amazon's pool of IPv4 addresses** (only option enabled)
4. Tags → **Add new tag**:
    - Key: `Name`
    - Value: `widenaturals-erp-demo-eip`
5. Click **Allocate**

### Associate
1. Green success banner → **Associate this Elastic IP address** (shortcut)
2. Resource type: **Instance**
3. Instance: dropdown → pick `widenaturals_erp_demo`
4. Private IP address: auto-fills (only option)
5. **`Allow this Elastic IP address to be reassociated`: LEAVE UNCHECKED** ⚠️
6. Click **Associate**

### Verify
EC2 → Instances → click `widenaturals_erp_demo`:
- Public IPv4 address: now shows the new EIP
- Elastic IP addresses: now shows the EIP (was `-` before)

**Save the EIP to your password manager.** That's your permanent SSH endpoint.

---

## 8. IAM admin user (stop using root)

1. Console search → **IAM**
2. Sidebar → **Users** → **Create user**
3. User name: `bob-admin` (replace `bob` with your name)
4. ✓ Provide user access to the AWS Management Console
5. Console password: **Custom password** → enter strong password (save to password manager)
6. ✗ Users must create a new password at next sign-in (uncheck — you're the only user)
7. Next → Permissions options: **Attach policies directly**
8. Permission policies: search and check **AdministratorAccess**
9. Next → Create user

### Enable MFA on this user
1. IAM → Users → click `bob-admin`
2. Security credentials tab → Multi-factor authentication (MFA) → **Assign MFA device**
3. Authenticator app → scan QR, enter codes → Add

### Save the IAM sign-in URL
Found on the user summary page. Format: `https://<account-id>.signin.aws.amazon.com/console`

**Log out of root, log in as `bob-admin` from now on.**

---

## 9. Dev IAM user for S3 (scoped, programmatic)

1. IAM → **Policies** → **Create policy**
2. JSON tab → paste:
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
3. Next → Policy name: `widenaturals-erp-dev-s3-access` → Create policy

### Create the user
1. IAM → **Users** → **Create user**
2. User name: `widenaturals-erp-dev`
3. ✗ Do NOT provide console access (programmatic only)
4. Next → **Attach policies directly** → search for `widenaturals-erp-dev-s3-access` → check it
5. Next → Create user

### Generate access key
1. IAM → Users → click `widenaturals-erp-dev`
2. Security credentials tab → Access keys → **Create access key**
3. Use case: **Application running outside AWS**
4. Next → no tag needed → Create access key
5. **Download the .csv** or copy both:
    - Access Key ID (`AKIA...`)
    - Secret Access Key (shown ONLY now — once you leave this page it's gone forever)
6. Save both to password manager
7. Done

---

## 10. Create three dev S3 buckets

For each of: `widenaturals-erp-dev-images`, `widenaturals-erp-dev-backups`, `widenaturals-erp-dev-logs`:

1. S3 console → **Create bucket**
2. AWS Region: **us-east-2** (same as EC2)
3. Bucket name: e.g. `widenaturals-erp-dev-images`
4. Object Ownership: ACLs disabled (default)
5. Block Public Access settings: **Block all public access: ON** (all four checkboxes) ✓
6. Bucket Versioning: **Disable** (cheap, fine for dev)
7. Default encryption: SSE-S3 (default — free)
8. Create bucket

### Lifecycle rules (on backups + logs buckets only)

For `widenaturals-erp-dev-backups`:
1. Open bucket → **Management** tab → **Lifecycle rules** → **Create lifecycle rule**
2. Rule name: `backup-glacier-then-expire` (name is a label only; misleading after the storage-class decision below, but lifecycle rules can't be renamed without recreate — leave as-is)
3. Status: Enable
4. Choose rule scope: **Apply to all objects in the bucket** (check the "I acknowledge..." box)
5. Lifecycle rule actions:
    - ✓ Transition current versions of objects between storage classes
        - Days after object creation: 30 → Storage class: **Standard-IA** ⚠️ (NOT Glacier IR — see decisions log)
    - ✓ Expire current versions of objects
        - Days after object creation: 90
6. **Check the "I acknowledge that this lifecycle rule will incur a transition cost per request" box** (yellow warning section — blocks Create until checked)
7. Create rule

Same for `widenaturals-erp-dev-logs`:
- Rule name: `log-glacier-then-expire`
- Transition: **Standard-IA** at 30 days (Standard-IA requires a 30-day minimum in Standard first — can't transition earlier)
- Expire at 60 days

---

## What's next

After this runbook completes, the AWS-side foundation is done. Continue with:

1. **Local S3 integration** (in your dev environment) — see Phase 6 of `aws-demo-deployment.md`
2. **Seed file split** — see Phase 7
3. **Production IAM + prod S3 buckets** — see Phase 10
4. **EC2 server provisioning + deploy** — see Phase 9
5. **Frontend to S3/CloudFront** — see Phase 11
6. **Backups + log archival cron** — see Phase 12

Do **not** SSH into EC2 yet — the local steps come first.

---

## Things that went wrong on this run (lessons learned)

- **Credit specification defaulted to `Unlimited`** — had to manually change to `Standard`. This is the easiest setting to miss. Top of the gotchas list.
- **Initial storage default was 8 GiB** — too small for this stack. Bumped to 20 GiB. Worth ~$1/mo.
- **Encryption was off by default** — turned on. Free, no reason not to.
- **Initially planned Glacier IR for lifecycle transitions** — realized at the form-fill step that Glacier IR has a 90-day minimum storage duration that doesn't line up with the 90-day expiration (would have triggered a 30-day phantom storage charge). Switched to Standard-IA, which has a 30-day minimum that aligns perfectly. Rule names still say "glacier" — that's just a label, doesn't affect behavior.
- **Lifecycle rule won't submit without acknowledgment checkbox** — there's a yellow warning box "I acknowledge that this lifecycle rule will incur a transition cost per request" that's easy to miss; submit fails silently until checked.
- **Standard-IA has TWO 30-day minimums, not one.** (1) 30-day storage duration AFTER transition (well known) AND (2) **30-day minimum BEFORE transition** — objects must spend at least 30 days in Standard before they can transition. Originally tried 14-day transition for the logs bucket, AWS rejected it. Updated to 30 days. This pre-transition minimum is not surfaced anywhere obvious in S3 docs.
- **Decided to switch region from us-east-2 → ca-west-1** (Calgary) for Canadian data residency and lower latency from Vancouver. Cost diff: ~$1/mo. Documented in Decisions log of main doc.
