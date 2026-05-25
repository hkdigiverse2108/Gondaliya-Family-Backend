# Gondaliya Family Backend — Flutter Models Reference

Generated from **Mongoose models** (`src/database/models/`) and **Joi validation** (`src/validation/`).  
Use this document to build Dart classes, `fromJson`/`toJson`, and API request bodies.

---

## Legend

| Label | Meaning |
|--------|---------|
| **(required)** | Must be present and non-null when **creating** the entity (Mongoose `required: true` and/or Joi `.required()` on create). |
| **(optional)** | May be omitted, `null`, or `''` (empty string) where Joi uses `.allow(null, '')`. |
| **DB only** | Stored in MongoDB but not accepted in client Joi body (server-set). |
| **Request only** | Joi validates the HTTP body; not always a top-level DB field (e.g. `userId` in update). |

### Flutter type mapping

| Backend | Flutter type | Notes |
|---------|--------------|--------|
| `String` | `String` | Use `String?` when optional. |
| `Number` | `int` or `double` | `otp`, `price`, `fileSize` → `int` if whole numbers only. |
| `Boolean` | `bool` | Use `bool?` when optional. |
| `Date` / ISO string | `DateTime` | Parse ISO-8601 strings from API. |
| `ObjectId` | `String` | 24-char hex MongoDB id. |
| `ObjectId[]` / ref | `String` | Single id as string. |
| `[String]` | `List<String>` | e.g. `deviceToken`, `photos`. |
| nested object | nested Dart class | See nested models below. |
| `any` / loose object | `Map<String, dynamic>?` | Prefer typed nested classes where defined. |

### Shared enums (`src/common/enum.ts`)

```dart
// USER_ROLES
"admin" | "user"   // default: "user"

// HOUSE_TYPES
"Own" | "Rented"

// MARITAL_STATUS
"married" | "unMarried"

// BLOOD_GROUPS
"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"

// RELATIONS
"Father" | "Mother" | "Husband" | "Wife" | "Son" | "Daughter" |
"Brother" | "Sister" | "Grandson" | "Granddaughter" |
"Daughter-in-law" | "Son-in-law" | "Other"
```

**Do not send** invalid enum strings — Mongoose/Joi will reject them.

---

## Nested models (no separate collection)

Use these inside **User** / **FamilyMember** and for API payloads.

### `WorkDetails` (nested)

| Field | Flutter | DB | Joi (signup/user) | Allowed / rules | Do NOT use |
|-------|---------|-----|-------------------|-----------------|------------|
| `hasOwnBusiness` | `bool?` | optional | optional | `true` / `false` / `null` | strings |
| `businessDetails` | `BusinessDetails?` | optional | optional | object or `null` | array |
| `jobDetails` | `JobDetails?` | optional | optional | object or `null` | array |

### `BusinessDetails` (nested)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `category` | `String?` | optional | optional | any string, `null`, `''` | — |
| `subCategory` | `String?` | optional | optional | any string, `null`, `''` | — |
| `businessName` | `String?` | optional | optional | any string, `null`, `''` | — |
| `ownerName` | `String?` | optional | optional | any string, `null`, `''` | — |
| `description` | `String?` | optional | optional | any string, `null`, `''` | — |
| `locations` | `List<BusinessLocation>?` | optional | optional | array of objects or `null` | single object |
| `contactInfo` | `ContactInfo?` | optional | optional | object or `null` | — |

### `BusinessLocation` (nested in `locations[]`)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `shopAddress` | `String?` | optional | optional | string, `null`, `''` | — |
| `areaCity` | `String?` | optional | optional | string, `null`, `''` | — |
| `state` | `String?` | optional | optional | string, `null`, `''` | — |
| `pincode` | `String?` | optional | optional | string, `null`, `''` | not forced to 6 digits in Joi |
| `googleMapLink` | `String?` | optional | optional | string, `null`, `''` | — |

### `ContactInfo` (nested)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `mobile1` | `String?` | optional | optional | string, `null`, `''` | — |
| `mobile2` | `String?` | optional | optional | string, `null`, `''` | — |
| `email` | `String?` | optional | optional | valid email or `null`, `''` | invalid email format |
| `website` | `String?` | optional | optional | string, `null`, `''` | — |
| `portfolioLink` | `String?` | optional | optional | string, `null`, `''` | — |

### `JobDetails` (nested)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `jobCategory` | `String?` | optional | optional | string, `null`, `''` | — |
| `jobRole` | `String?` | optional | optional | string, `null`, `''` | — |
| `companyName` | `String?` | optional | optional | string, `null`, `''` | — |
| `jobLocation` | `String?` | optional | optional | string, `null`, `''` | — |

### `LinkedFamily` (nested on User)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `headUserId` | `String?` | optional | — | ObjectId ref `user` | invalid ObjectId |
| `familyMemberRefId` | `String?` | optional | — | ObjectId (subdoc id) | — |

### `ListingLocation` (nested on Listing)

| Field | Flutter | DB | Joi (create) | Allowed / rules | Do NOT use |
|-------|---------|-----|--------------|-----------------|------------|
| `city` | `String` | **(required)** | **(required)** | non-empty on create | `null` on create |
| `pincode` | `String` | **(required)** | **(required)** | non-empty on create | `null` on create |

---

## 1. User (`user`)

**Source:** `src/database/models/user.ts`  
**Joi:** `signUpSchema` (auth), `createUser`, `updateUser`, `addFamilyMemberSchema`, `updateFamilyMemberSchema`

### 1.1 User — document fields (API response / full model)

| Field | Flutter | DB | Joi signup/create | Joi update | Allowed / rules | Do NOT use |
|-------|---------|-----|-------------------|------------|-----------------|------------|
| `_id` | `String` | auto | — | — | 24-char ObjectId | — |
| `firstName` | `String` | **(required)** | **(required)** | optional | non-empty string on create | empty on create |
| `middleName` | `String` | **(required)** | **(required)** | optional | non-empty on create | — |
| `lastName` | `String` | **(required)** | **(required)** | optional | non-empty on create | — |
| `profilePhoto` | `String?` | optional | optional | optional | URL/path string, `null`, `''` | — |
| `dob` | `String?` | optional | optional | optional | date as **string** (not Date object in Joi) | Date object in JSON body |
| `education` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `isMarried` | `String?` | optional | optional | optional | `married` \| `unMarried` | other values |
| `bloodGroup` | `String?` | optional | optional | optional | BLOOD_GROUPS enum | other values |
| `phoneNumber` | `String` | **(required)** | **(required)** length 10 | optional length 10 | exactly **10** digits (Joi) | &lt;10 or &gt;10 chars |
| `phoneNumber2` | `String?` | optional | optional length 10 | optional | exactly 10 if sent | wrong length |
| `password` | `String` | stored hashed | **(required)** signup/create | optional | min 6 on **reset** only; signup: any string required | send plain text only over HTTPS; never store in Flutter long-term |
| `otp` | `int?` | optional | — | — | **DB only** — server OTP flow | client model for display only |
| `role` | `String` | optional default `user` | optional signup | — | `admin` \| `user` | invalid role |
| `nativeVillage` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `nativeTaluka` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `nativeDistrict` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `village` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `pincode` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `taluka` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `district` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `currentAddress` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `currentCity` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `currentState` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `houseType` | `String?` | optional | optional | optional | `Own` \| `Rented` | other values |
| `familyMembers` | `List<FamilyMember>?` | optional array | optional | optional | array of objects | — |
| `isHeadOfFamily` | `bool` | default `true` | — | — | boolean | — |
| `linkedFamily` | `LinkedFamily?` | optional | — | — | nested object | — |
| `workDetails` | `WorkDetails?` | optional | optional | optional | nested | — |
| `isDeleted` | `bool` | default `false` | — | — | boolean | — |
| `isActive` | `bool` | default `true` | optional signup | optional update | boolean | — |
| `isLoggedIn` | `bool` | default `false` | — | — | **DB only** | — |
| `deviceToken` | `List<String>?` | default `[]` | — | — | FCM tokens array | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO date string from API | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO date string from API | — |

**Note:** `updateUser` Joi includes `email` but **User schema has no `email` field** — do not map `email` on User model unless backend adds it.

**Never expose in Flutter UI from API:** `password` (hashed), `otp` (except transient OTP screen).

---

### 1.2 FamilyMember (subdocument in `user.familyMembers[]`)

| Field | Flutter | DB | Joi (member) | Allowed / rules | Do NOT use |
|-------|---------|-----|--------------|-----------------|------------|
| `_id` | `String` | auto subdoc id | — | ObjectId string | — |
| `firstName` | `String?` | optional | optional | string, `null`, `''` | — |
| `middleName` | `String?` | optional | optional | string, `null`, `''` | — |
| `lastName` | `String?` | optional | optional | string, `null`, `''` | — |
| `profilePhoto` | `String?` | optional | optional | string, `null`, `''` | — |
| `relation` | `String?` | optional | optional | RELATIONS enum | invalid relation |
| `dob` | `String?` | optional | optional | string, `null`, `''` | — |
| `education` | `String?` | optional | optional | string, `null`, `''` | — |
| `isMarried` | `String?` | optional | optional | MARITAL_STATUS enum | — |
| `bloodGroup` | `String?` | optional | optional | BLOOD_GROUPS enum | — |
| `phoneNumber` | `String?` | optional | optional | length **10** if sent | wrong length |
| `workDetails` | `WorkDetails?` | optional | optional | nested | — |
| `linkedUserId` | `String?` | optional | — | ref `user` ObjectId | — |
| `isIndependent` | `bool` | default `false` | — | boolean | — |

**Add family member request** (`addFamilyMemberSchema`): params `id` (user ObjectId) **(required)** + same optional fields as above.

**Update family member:** params `id` + `memberId` **(required)** + optional fields.

---

### 1.3 Auth Joi payloads (no separate DB model)

#### `signUpSchema` / register body

Same required/optional as **User create** in table 1.1 (Joi signup column). Extra: `role`, `isActive` optional.

#### `loginSchema`

| Field | Flutter | Joi | Rules |
|-------|---------|-----|--------|
| `phoneNumber` | `String` | **(required)** | length 10 |
| `password` | `String` | **(required)** | string |

#### `otpVerificationSchema`

| Field | Flutter | Joi | Rules |
|-------|---------|-----|--------|
| `phoneNumber` | `String` | **(required)** | length 10 |
| `otp` | `int` | **(required)** | number, not string |

#### `forgotPasswordSchema`

| Field | Flutter | Joi |
|-------|---------|-----|
| `phoneNumber` | `String` | **(required)** length 10 |

#### `resetPasswordSchema`

| Field | Flutter | Joi |
|-------|---------|-----|
| `phoneNumber` | `String` | **(required)** length 10 |
| `password` | `String` | **(required)** min length 6 |

---

### 1.4 User admin/query Joi (not stored fields)

| Schema | Field | Flutter | Joi |
|--------|-------|---------|-----|
| `updateUser` | `userId` | `String` | **(required)** valid ObjectId |
| `deleteUser` / `getUserById` | `id` | `String` | **(required)** ObjectId |
| `getUsers` | `page`, `limit` | `int?` | optional |
| `getUsers` | `search`, `sortFilter`, `activeFilter`, `startDateFilter`, `endDateFilter` | `String?` | optional |

---

## 2. Location (`location`)

**Source:** `src/database/models/location.ts`  
**Joi:** `createLocation`, `updateLocation`, `getLocations`, `deleteLocation`

| Field | Flutter | DB | Joi create | Joi update | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|------------|-----------------|------------|
| `_id` | `String` | auto | — | — | ObjectId | — |
| `village` | `String` | **(required)** | **(required)** | optional | string | — |
| `taluka` | `String` | **(required)** | **(required)** | optional | string | — |
| `district` | `String` | **(required)** | **(required)** | optional | string | — |
| `pincode` | `String?` | optional | optional | optional | string | — |
| `isActive` | `bool` | default `true` | — | optional | boolean | — |
| `isDeleted` | `bool` | default `false` | — | — | boolean | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO string | — |

**Delete/update params:** `id` **(required)** ObjectId.

**Query `getLocations`:** `page`, `limit`, `search` — all optional.

---

## 3. Announcement (`announcement`)

**Source:** `src/database/models/announcement.ts`  
**Joi:** `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `getAnnouncements`

| Field | Flutter | DB | Joi create | Joi update | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|------------|-----------------|------------|
| `_id` | `String` | auto | — | — | ObjectId | — |
| `title` | `String` | **(required)** | **(required)** | optional | string | — |
| `description` | `String` | **(required)** | **(required)** | optional | string | — |
| `imageUrl` | `String?` | optional | optional | optional | string, `null`, `''` | — |
| `createdBy` | `String` | **(required)** | — | — | ObjectId ref `user` — set by server from auth | client-forged id |
| `isActive` | `bool` | default `true` | — | optional | boolean | — |
| `isDeleted` | `bool` | default `false` | — | — | boolean | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO string | — |

**Update params:** one of `id` or `announcementId` **(required)** (`.or()`).

---

## 4. Chat (`chat`)

**Source:** `src/database/models/chat.ts`  
**Joi:** `sendChatMessage`, `deleteChatMessage`, `blockChatMessage`, `getChatMessages`

| Field | Flutter | DB | Joi send | Allowed / rules | Do NOT use |
|-------|---------|-----|----------|-----------------|------------|
| `_id` | `String` | auto | — | ObjectId | — |
| `senderId` | `String` | **(required)** | — | ref `user` — from auth | — |
| `message` | `String?` | optional default null | optional | string, `null`, `''` | — |
| `mediaUrl` | `String?` | optional | optional | string, `null`, `''` | — |
| `mediaType` | `String` | default `TEXT` | optional | `TEXT` \| `IMAGE` \| `VIDEO` \| `FILE` | other values |
| `fileSize` | `int` | default `0` | optional | number ≥ 0 | string |
| `isDeleted` | `bool` | default `false` | — | boolean | — |
| `isBlocked` | `bool` | default `false` | — | boolean | — |
| `deletedBy` | `String?` | optional | — | ObjectId ref `user` | — |
| `createdAt` | `DateTime?` | timestamps | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | ISO string | — |

**Send body:** at least one of `message` or `mediaUrl` is typical UX; Joi allows both empty/null.

**Query `getChatMessages`:** `page`, `limit` optional; `my`: `"true"` \| `"false"` optional.

### Real-time (Socket.IO)

Connect to the **same host/port** as the REST API (e.g. `http://192.168.29.26:5000`). Pass the same JWT used for `/chat` routes.

| Socket event (listen) | When emitted | Payload |
|----------------------|--------------|---------|
| `chat:connected` | After auth + join room | `{ room, userId, events }` |
| `chat:message` | `POST /chat/add` success | Populated chat document (same shape as REST `data`) |
| `chat:removed` | Admin `DELETE /chat/:id` | `{ id }` |
| `chat:blocked` | Admin `PUT /chat/block` | `{ id }` |

**Auth (handshake):** set `auth.token` or `auth.authorization` to the Bearer token (or raw JWT). Sending messages still uses `POST /chat/add`; the socket only receives broadcasts.

```dart
socket = IO.io(
  baseUrl,
  IO.OptionBuilder()
    .setTransports(['websocket', 'polling'])
    .setAuth({'token': 'Bearer $accessToken'})
    .build(),
);
socket.on('chat:connected', (_) {});
socket.on('chat:message', (data) { /* append to list */ });
```

---

## 5. Feedback (`feedback`)

**Source:** `src/database/models/feedback.ts`  
**Joi:** `createFeedback`, `updateFeedbackStatus`, `getFeedbackById`, `getFeedbacks`

| Field | Flutter | DB | Joi create | Joi admin update | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|------------------|-----------------|------------|
| `_id` | `String` | auto | — | — | ObjectId | — |
| `userId` | `String` | **(required)** | — | — | ref `user` — server from auth | — |
| `type` | `String` | **(required)** | **(required)** | — | `FEEDBACK` \| `COMPLAINT` | other strings |
| `message` | `String` | **(required)** | **(required)** | — | non-empty on create | — |
| `status` | `String` | default `PENDING` | — | **(required)** on status update | `PENDING` \| `REVIEWED` \| `RESOLVED` | — |
| `adminNote` | `String?` | optional | — | optional | string, `null`, `''` | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO string | — |

**Create body (client):** only `type` + `message` — no `userId` in Joi (server assigns).

**List query:** optional `type`, `status` filters; `page`, `limit`.

---

## 6. Inquiry (`inquiry`)

**Source:** `src/database/models/inquiry.ts`  
**Joi:** `createInquiry`, `replyInquiry`, `readInquiry`, `getInquiryById`, `getInquiries`

| Field | Flutter | DB | Joi create | Joi reply | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|-----------|-----------------|------------|
| `_id` | `String` | auto | — | — | ObjectId | — |
| `senderId` | `String` | **(required)** | — | — | ref `user` — server | — |
| `targetType` | `String` | **(required)** | **(required)** | — | `BUSINESS` \| `LISTING` | `USER`, etc. |
| `targetId` | `String` | **(required)** | **(required)** | — | ObjectId (user or listing) | invalid id |
| `message` | `String` | **(required)** max 500 | **(required)** max 500 | — | ≤ 500 chars | &gt; 500 chars |
| `reply` | `String?` | optional | — | **(required)** in reply API | string | — |
| `repliedAt` | `DateTime?` | optional | — | — | set when replied | — |
| `isRead` | `bool` | default `false` | — | — | boolean | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO string | — |

**Create body:** `targetType`, `targetId`, `message` only.

---

## 7. Listing (`listing`)

**Source:** `src/database/models/listing.ts`  
**Joi:** `createListing`, `updateListing`, `updateListingStatus`, `getListingById`, `getListings`

| Field | Flutter | DB | Joi create | Joi update | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|------------|-----------------|------------|
| `_id` | `String` | auto | — | — | ObjectId | — |
| `postedBy` | `String` | **(required)** | — | — | ref `user` — server | — |
| `type` | `String` | **(required)** | **(required)** | — on create only in update optional | `RENT` \| `SEASONAL` \| `SECONDHAND` | — |
| `title` | `String` | **(required)** | **(required)** | optional | string | — |
| `description` | `String` | **(required)** | **(required)** | optional | string | — |
| `photos` | `List<String>?` | array of strings | optional max **5** | optional max 5 | URL strings, max 5 items | &gt;5 photos |
| `price` | `num` | **(required)** | **(required)** | optional | number | string |
| `priceUnit` | `String` | **(required)** | **(required)** | optional | `PER_DAY` \| `PER_MONTH` \| `FIXED` | — |
| `availableFrom` | `DateTime` | **(required)** Date | **(required)** string ISO | optional string | ISO date string in API body | invalid date |
| `availableTo` | `DateTime?` | optional Date | optional string | optional | ISO or `null`, `''` | — |
| `location` | `ListingLocation` | nested required | **(required)** object | optional partial | `city`, `pincode` required on create | — |
| `contactPhone` | `String` | **(required)** | **(required)** | optional | string (no length rule in Joi) | — |
| `status` | `String` | default `ACTIVE` | — | optional | `ACTIVE` \| `SOLD` \| `CLOSED` | — |
| `isDeleted` | `bool` | default `false` | — | — | boolean | — |
| `createdAt` | `DateTime?` | timestamps | — | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | — | ISO string | — |

**Status-only update:** `status` **(required)** — only `SOLD` or `CLOSED` (not `ACTIVE` in that schema).

**List query:** `page`, `limit`, `type`, `city`, `search`, `my` (`"true"`\|`"false"`) — all optional.

---

## 8. Notification (`notification`)

**Source:** `src/database/models/notification.ts`  
**Joi:** `getNotifications` only (no create Joi — server-generated)

| Field | Flutter | DB | Joi | Allowed / rules | Do NOT use |
|-------|---------|-----|-----|-----------------|------------|
| `_id` | `String` | auto | — | ObjectId | — |
| `userId` | `String` | **(required)** | — | ref `user` | — |
| `title` | `String` | **(required)** | — | string | — |
| `body` | `String` | **(required)** | — | string | — |
| `type` | `String` | **(required)** | — | `ANNOUNCEMENT` \| `INQUIRY` \| `REPLY` \| `SYSTEM` | other values |
| `refId` | `String` | **(required)** | — | ObjectId (related entity) | — |
| `isRead` | `bool` | default `false` | — | boolean | — |
| `createdAt` | `DateTime?` | created only | — | **no `updatedAt`** on this model | — |

**Query:** `page`, `limit` optional.

---

## 9. Support (`support`)

**Source:** `src/database/models/support.ts`  
**Joi:** `updateSupport` (singleton config — no create Joi)

| Field | Flutter | DB | Joi update | Allowed / rules | Do NOT use |
|-------|---------|-----|------------|-----------------|------------|
| `_id` | `String` | auto | — | ObjectId | — |
| `phone` | `String` | **(required)** | **(required)** | string | — |
| `phone2` | `String?` | optional | optional | string, `null`, `''` | — |
| `email` | `String` | **(required)** | **(required)** | valid email | invalid email |
| `address` | `String?` | optional | optional | string, `null`, `''` | — |
| `createdAt` | `DateTime?` | timestamps | — | ISO string | — |
| `updatedAt` | `DateTime?` | timestamps | — | ISO string | — |

---

## 10. Parivar (no MongoDB model)

**Joi:** `getParivar` — query only, returns aggregated **User** directory data.

| Query param | Flutter | Joi | Rules |
|-------------|---------|-----|--------|
| `village` | `String?` | optional | allow `''` |
| `search` | `String?` | optional | allow `''` |

**Response shapes (for Flutter):**

- `getVillages`: `List<String>` — distinct village names.
- `getParivarDirectory`: list of **User**-like objects (heads of family, `isHeadOfFamily: true`) — use **User** + **FamilyMember** models for parsing; fields may be projected subset from controller.

---

## Suggested Dart file layout

```
lib/models/
  enums.dart              // all string enums above
  work_details.dart       // WorkDetails, BusinessDetails, JobDetails, ...
  user.dart               // User, FamilyMember, LinkedFamily
  location.dart
  announcement.dart
  chat.dart
  feedback.dart
  inquiry.dart
  listing.dart
  notification.dart
  support.dart
  api_requests/           // login, signup, createListing, ...
    auth_requests.dart
    user_requests.dart
    ...
```

### Example Dart field annotation pattern

```dart
class User {
  final String id;                    // required in response
  final String firstName;             // required
  final String? profilePhoto;         // optional
  final List<String> deviceToken;     // optional in DB, default []
  // ...
}
```

Use `required` constructor params for non-nullable API fields; `?` for optional/nullable.

---

## Joi global behavior (all routes using `validateRequest`)

- **`allowUnknown: false`** on body — do not send extra keys not in schema.
- **ObjectId** params: must be valid 24-char hex (`isValidObjectId`).
- **Phone numbers:** 10-character strings where `.length(10)` is specified (not necessarily all digits unless you add client-side digit-only validation).

---

## Quick reference: which Joi schema for which action

| Action | Joi schema | File |
|--------|------------|------|
| Sign up | `signUpSchema` | `validation/auth.ts` |
| Login | `loginSchema` | `validation/auth.ts` |
| OTP verify | `otpVerificationSchema` | `validation/auth.ts` |
| Forgot / reset password | `forgotPasswordSchema`, `resetPasswordSchema` | `validation/auth.ts` |
| Admin create user | `createUser` | `validation/user.ts` |
| Update user | `updateUser` | `validation/user.ts` |
| Family member CRUD | `addFamilyMemberSchema`, `updateFamilyMemberSchema`, `deleteFamilyMemberSchema` | `validation/user.ts` |
| Location CRUD | `createLocation`, `updateLocation` | `validation/location.ts` |
| Announcement | `createAnnouncement`, `updateAnnouncement` | `validation/announcement.ts` |
| Chat send | `sendChatMessage` | `validation/chat.ts` |
| Feedback | `createFeedback` | `validation/feedback.ts` |
| Inquiry | `createInquiry`, `replyInquiry` | `validation/inquiry.ts` |
| Listing | `createListing`, `updateListing`, `updateListingStatus` | `validation/listing.ts` |
| Notifications list | `getNotifications` | `validation/notification.ts` |
| Support update | `updateSupport` | `validation/support.ts` |
| Parivar directory | `getParivar` | `validation/parivar.ts` |

---

*Last synced with backend models and Joi validators in this repository.*
