# LinkUp account validation

LinkUp accepts accounts only from an active school directory entry. The directory
lives in Firestore so adding a district, school, or email domain does not require a
code deployment.

## Verification paths

### Email verification

Firebase sends a verification link to the approved school address. A verified
Firebase email satisfies the account verification requirement.

### Manual verification

If the school blocks Firebase email, the student may request manual review. A
reviewer must confirm the exact student and school using one of these methods:

- an official school roster;
- an in-person check;
- confirmation from an authorized school staff member.

Do not approve from the email address alone. Do not collect student-ID photos or
other identity documents in LinkUp. Approval sets a server-controlled custom claim
and records the reviewer, method, school, and review timestamp. Students do not
need 2FA for this fallback.

## Firestore directory

The server reads three collections. Client access is denied by Firestore rules.

### `districts/{districtId}`

```text
name: "Richardson Independent School District"
active: true
```

### `schools/{schoolId}`

```text
name: "Richardson High School"
districtId: "richardson-isd"
active: true
```

### `schoolDomains/{domain}`

The document ID is the exact lowercase email domain.

```text
districtId: "richardson-isd"
schoolId: null
active: true
```

Use `schoolId: null` for a domain shared across a district. Set `schoolId` when a
domain belongs to exactly one school; LinkUp then locks the selection to that
school.

## Admin bootstrap

The initial admin role must be added in the Firebase console by a project owner.
Create `admins/{firebaseUid}` with:

```text
active: true
roles: ["account_reviewer", "school_directory_admin"]
```

After deployment:

- `/admin/schools` manages the directory without code changes.
- `/admin/account-verifications` reviews manual account requests.

Admin APIs verify the signed-in Firebase ID token and read this server-only role
document. Approval actions are not available through direct client Firestore
writes.

## Required runtime configuration

The Vercel project needs the server-only Firebase Admin environment variables
listed in `.env.example`. Never expose these values with a `NEXT_PUBLIC_` prefix,
paste them into chat, or commit them.

## Release gate

Before enabling a new district:

1. Verify the district and school names from an official source.
2. Confirm the exact student email domain with the district.
3. Add and review the directory records.
4. Test email verification with a non-production student account.
5. Test manual approval, token refresh, profile creation, and cross-school denial.
