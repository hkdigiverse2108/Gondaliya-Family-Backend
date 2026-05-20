export const USER_ROLES = {
    ADMIN: "admin",
    USER: "user",
} as const;

export const HOUSE_TYPES = {
    OWN: "Own",
    RENTED: "Rented",
} as const;

export const MARITAL_STATUS = {
    MARRIED: "married",
    UN_MARRIED: "unMarried"
} as const;

export const BLOOD_GROUPS = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
} as const;

export const RELATIONS = {
    FATHER: "Father",
    MOTHER: "Mother",
    HUSBAND: "Husband",
    WIFE: "Wife",
    SON: "Son",
    DAUGHTER: "Daughter",
    BROTHER: "Brother",
    SISTER: "Sister",
    GRANDSON: "Grandson",
    GRANDDAUGHTER: "Granddaughter",
    DAUGHTER_IN_LAW: "Daughter-in-law",
    SON_IN_LAW: "Son-in-law",
    OTHER: "Other",
} as const;