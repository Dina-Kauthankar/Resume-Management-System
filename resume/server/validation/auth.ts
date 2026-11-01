import {
  type ApplicantType,
  type Role,
} from "@/server/auth";

// ============================================================
// REGISTER DTO
// ============================================================

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  role?: Role;
  applicantType?: ApplicantType;
  phone?: string;
  collegeDetails?: string;
}

// ============================================================
// LOGIN DTO
// ============================================================

export interface LoginDTO {
  email: string;
  password: string;
}

// ============================================================
// VALIDATION CONSTANTS
// ============================================================

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 6;
const MAX_EMAIL_LENGTH = 254;

// ============================================================
// FULL NAME VALIDATION
// ============================================================

function validateFullName(
  fullName: unknown
): {
  valid: boolean;
  error?: string;
} {
  // Must be a string
  if (typeof fullName !== "string") {
    return {
      valid: false,
      error: "Full Name must be a valid text value.",
    };
  }

  // Remove surrounding whitespace only for validation.
  // We still reject the original value if it contains
  // leading/trailing whitespace.
  const trimmedName = fullName.trim();

  // Required
  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: "Full Name is required.",
    };
  }

  // Reject leading/trailing whitespace
  if (fullName !== trimmedName) {
    return {
      valid: false,
      error:
        "Full Name must not contain leading or trailing spaces.",
    };
  }

  // Length validation
  if (trimmedName.length < MIN_NAME_LENGTH) {
    return {
      valid: false,
      error:
        "Full Name must be at least 2 characters long.",
    };
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      error:
        "Full Name must not exceed 100 characters.",
    };
  }

  // ==========================================================
  // ALLOWED CHARACTERS
  // ==========================================================
  //
  // \p{L}  = Any Unicode letter
  // \p{M}  = Unicode combining marks
  // '      = Single quote
  // space  = Normal ASCII space
  //
  // Examples allowed:
  // John Doe
  // O'Connor
  // José García
  // Chloë Martin
  //
  // Examples rejected:
  // John123
  // John-Doe
  // John.Doe
  // John@Doe
  // John/Doe
  // John_Doe
  // John😊
  //
  const allowedCharactersRegex = /^[\p{L}\p{M}' ]+$/u;

  if (!allowedCharactersRegex.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Full Name can contain only letters, spaces, and single quotes (').",
    };
  }

  // ==========================================================
  // NO CONSECUTIVE SPACES
  // ==========================================================

  if (/\s{2,}/.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Full Name must not contain consecutive spaces.",
    };
  }

  // ==========================================================
  // APOSTROPHE VALIDATION
  // ==========================================================
  //
  // Apostrophe must appear between letters.
  //
  // Valid:
  // O'Connor
  // D'Angelo
  // O'Neil
  //
  // Invalid:
  // 'Dina
  // Dina'
  // Dina''K
  // O''Connor
  //

  if (
    /(^'|'$|''|'\s|\s')/.test(trimmedName)
  ) {
    return {
      valid: false,
      error:
        "Single quotes must appear only between letters in the name.",
    };
  }

  // ==========================================================
  // NAME MUST CONTAIN AT LEAST ONE LETTER
  // ==========================================================

  if (!/\p{L}/u.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Full Name must contain at least one letter.",
    };
  }

  return {
    valid: true,
  };
}

// ============================================================
// EMAIL VALIDATION
// ============================================================

function validateEmail(
  email: unknown
): {
  valid: boolean;
  error?: string;
} {
  if (typeof email !== "string") {
    return {
      valid: false,
      error: "Email must be a valid text value.",
    };
  }

  if (email.length === 0) {
    return {
      valid: false,
      error: "Email is required.",
    };
  }

  // Reject leading/trailing whitespace
  if (email !== email.trim()) {
    return {
      valid: false,
      error:
        "Email must not contain leading or trailing spaces.",
    };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return {
      valid: false,
      error:
        "Email address is too long.",
    };
  }

  // Basic but strict email structure.
  //
  // This intentionally does not attempt to implement the
  // complete RFC email specification.
  const emailRegex =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error:
        "Please enter a valid email address.",
    };
  }

  // Prevent consecutive dots
  if (email.includes("..")) {
    return {
      valid: false,
      error:
        "Email address must not contain consecutive dots.",
    };
  }

  return {
    valid: true,
  };
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(
  password: unknown
): {
  valid: boolean;
  error?: string;
} {
  if (typeof password !== "string") {
    return {
      valid: false,
      error: "Password must be a valid text value.",
    };
  }

  if (password.length === 0) {
    return {
      valid: false,
      error: "Password is required.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error:
        "Password must be at least 6 characters long.",
    };
  }

  return {
    valid: true,
  };
}

// ============================================================
// VALIDATE REGISTER INPUT
// ============================================================

export function validateRegisterInput(
  data: Partial<RegisterDTO>
): {
  valid: boolean;
  error?: string;
} {
  // ==========================================================
  // INPUT OBJECT VALIDATION
  // ==========================================================

  if (
    !data ||
    typeof data !== "object"
  ) {
    return {
      valid: false,
      error: "Invalid registration data.",
    };
  }

  // ==========================================================
  // FULL NAME
  // ==========================================================

  const fullNameValidation =
    validateFullName(data.fullName);

  if (!fullNameValidation.valid) {
    return fullNameValidation;
  }

  // ==========================================================
  // EMAIL
  // ==========================================================

  const emailValidation =
    validateEmail(data.email);

  if (!emailValidation.valid) {
    return emailValidation;
  }

  // ==========================================================
  // PASSWORD
  // ==========================================================

  const passwordValidation =
    validatePassword(data.password);

  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  // ==========================================================
  // APPLICANT TYPE
  // ==========================================================

  if (
    data.applicantType !== undefined &&
    ![
      "SINGLE_JOB_SEEKER",
      "SINGLE_INTERN",
      "BATCH_INTERN",
    ].includes(data.applicantType)
  ) {
    return {
      valid: false,
      error:
        "Invalid applicant type specified.",
    };
  }

  // ==========================================================
  // ROLE
  // ==========================================================

  if (
    data.role !== undefined &&
    !["HR", "CANDIDATE"].includes(data.role)
  ) {
    return {
      valid: false,
      error: "Invalid role specified.",
    };
  }

  // ==========================================================
  // OPTIONAL PHONE VALIDATION
  // ==========================================================

  if (data.phone !== undefined) {
    if (typeof data.phone !== "string") {
      return {
        valid: false,
        error: "Phone number must be a valid text value.",
      };
    }

    if (data.phone.trim() !== data.phone) {
      return {
        valid: false,
        error:
          "Phone number must not contain leading or trailing spaces.",
      };
    }
  }

  // ==========================================================
  // OPTIONAL COLLEGE DETAILS VALIDATION
  // ==========================================================

  if (data.collegeDetails !== undefined) {
    if (typeof data.collegeDetails !== "string") {
      return {
        valid: false,
        error:
          "College details must be a valid text value.",
      };
    }

    if (data.collegeDetails.length > 500) {
      return {
        valid: false,
        error:
          "College details must not exceed 500 characters.",
      };
    }
  }

  // ==========================================================
  // EVERYTHING VALID
  // ==========================================================

  return {
    valid: true,
  };
}

// ============================================================
// VALIDATE LOGIN INPUT
// ============================================================

export function validateLoginInput(
  data: Partial<LoginDTO>
): {
  valid: boolean;
  error?: string;
} {
  // ==========================================================
  // INPUT OBJECT VALIDATION
  // ==========================================================

  if (
    !data ||
    typeof data !== "object"
  ) {
    return {
      valid: false,
      error: "Invalid login data.",
    };
  }

  // ==========================================================
  // EMAIL
  // ==========================================================

  // const emailValidation =
  //   validateEmail(data.email);

  // if (!emailValidation.valid) {
  //   return emailValidation;
  // }

  // ============================================================
  // EMAIL VALIDATION
  // ============================================================

  function validateEmail(
    email: unknown
  ): {
    valid: boolean;
    error?: string;
  } {
    // Must be a string
    if (typeof email !== "string") {
      return {
        valid: false,
        error: "Email must be a valid text value.",
      };
    }

    // Required
    if (email.length === 0) {
      return {
        valid: false,
        error: "Email is required.",
      };
    }

    // Maximum email length
    if (email.length > 254) {
      return {
        valid: false,
        error:
          "Email address must not exceed 254 characters.",
      };
    }

    // No leading/trailing whitespace
    if (email !== email.trim()) {
      return {
        valid: false,
        error:
          "Email address must not contain leading or trailing spaces.",
      };
    }

    // No whitespace anywhere
    if (/\s/.test(email)) {
      return {
        valid: false,
        error:
          "Email address must not contain spaces.",
      };
    }

    // Must contain exactly one @
    const atCount = (email.match(/@/g) || []).length;

    if (atCount !== 1) {
      return {
        valid: false,
        error:
          "Please enter a valid email address.",
      };
    }

    const [localPart, domain] = email.split("@");

    // Both parts are required
    if (!localPart || !domain) {
      return {
        valid: false,
        error:
          "Please enter a valid email address.",
      };
    }

    // ==========================================================
    // LOCAL PART
    // ==========================================================

    // Maximum length before @
    if (localPart.length > 64) {
      return {
        valid: false,
        error:
          "The email username must not exceed 64 characters.",
      };
    }

    // Cannot start or end with a dot
    if (
      localPart.startsWith(".") ||
      localPart.endsWith(".")
    ) {
      return {
        valid: false,
        error:
          "Email username cannot start or end with a dot.",
      };
    }

    // No consecutive dots
    if (localPart.includes("..")) {
      return {
        valid: false,
        error:
          "Email address must not contain consecutive dots.",
      };
    }

    // Allowed characters in the local part
    //
    // Allows:
    // letters
    // numbers
    // . ! # $ % & ' * + / = ? ^ _ ` { | } ~ -
    //
    // Rejects spaces, emoji, brackets, etc.
    const localPartRegex =
      /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

    if (!localPartRegex.test(localPart)) {
      return {
        valid: false,
        error:
          "Email username contains invalid characters.",
      };
    }

    // ==========================================================
    // DOMAIN
    // ==========================================================

    // Domain must contain a dot
    if (!domain.includes(".")) {
      return {
        valid: false,
        error:
          "Email domain must contain a valid extension, such as .com or .in.",
      };
    }

    // Domain cannot start/end with a dot
    if (
      domain.startsWith(".") ||
      domain.endsWith(".")
    ) {
      return {
        valid: false,
        error:
          "Email domain cannot start or end with a dot.",
      };
    }

    // No consecutive dots
    if (domain.includes("..")) {
      return {
        valid: false,
        error:
          "Email domain must not contain consecutive dots.",
      };
    }

    // Domain can contain only ASCII letters,
    // numbers, hyphens and dots.
    const domainRegex =
      /^[A-Za-z0-9.-]+$/;

    if (!domainRegex.test(domain)) {
      return {
        valid: false,
        error:
          "Email domain contains invalid characters.",
      };
    }

    // ==========================================================
    // DOMAIN LABEL VALIDATION
    // ==========================================================

    const domainLabels = domain.split(".");

    for (const label of domainLabels) {
      // Empty label
      if (label.length === 0) {
        return {
          valid: false,
          error:
            "Email domain contains an invalid section.",
        };
      }

      // Domain labels cannot start/end with -
      if (
        label.startsWith("-") ||
        label.endsWith("-")
      ) {
        return {
          valid: false,
          error:
            "Email domain cannot start or end with a hyphen.",
        };
      }

      // Maximum DNS label length
      if (label.length > 63) {
        return {
          valid: false,
          error:
            "Email domain contains a section that is too long.",
        };
      }
    }

    // ==========================================================
    // TOP-LEVEL DOMAIN
    // ==========================================================

    const topLevelDomain =
      domainLabels[domainLabels.length - 1];

    // Require at least 2 alphabetic characters
    if (
      !/^[A-Za-z]{2,}$/.test(topLevelDomain)
    ) {
      return {
        valid: false,
        error:
          "Please enter a valid email domain extension.",
      };
    }

    return {
      valid: true,
    };
  }
  // ==========================================================
  // PASSWORD
  // ==========================================================

  const passwordValidation =
    validatePassword(data.password);

  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  // ==========================================================
  // EVERYTHING VALID
  // ==========================================================

  return {
    valid: true,
  };
}