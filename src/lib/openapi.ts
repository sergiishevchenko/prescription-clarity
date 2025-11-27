export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Prescription Clarity API",
    version: "2.0.0",
    description:
      "REST API for medication tracking and scheduling. Supports authentication, medication management, schedule creation, and PDF export.",
    contact: {
      name: "GoIT Capstone Team",
    },
  },
  servers: [{ url: "http://localhost:3000", description: "Local Development" }],
  tags: [
    {
      name: "Auth",
      description: "User authentication (register, login, logout)",
    },
    { name: "Profile", description: "User profile management" },
    { name: "Medications", description: "Medication CRUD operations" },
    {
      name: "Schedule",
      description: "Schedule templates and entries management",
    },
    {
      name: "Schedule Entries",
      description: "Individual schedule entry operations",
    },
    { name: "Export", description: "Data export (PDF)" },
  ],
  paths: {
    // ==================== AUTH ====================
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates a new user account and returns a session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                email: "john.doe@example.com",
                password: "securePassword123",
                name: "John Doe",
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
            headers: {
              "Set-Cookie": {
                description: "HTTP-only session cookie",
                schema: {
                  type: "string",
                  example:
                    "session_token=abc123; HttpOnly; Secure; SameSite=Lax",
                },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                example: {
                  user: {
                    id: "clx1234567890",
                    email: "john.doe@example.com",
                    name: "John Doe",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: "Invalid input data",
                  details: {
                    fieldErrors: {
                      password: ["String must contain at least 6 character(s)"],
                    },
                  },
                },
              },
            },
          },
          409: {
            description: "Email already in use",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "User with this email already exists" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login",
        description:
          "Authenticates a user and returns a session cookie. All previous sessions are invalidated.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                email: "john.doe@example.com",
                password: "securePassword123",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            headers: {
              "Set-Cookie": {
                description: "HTTP-only session cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                example: {
                  user: {
                    id: "clx1234567890",
                    email: "john.doe@example.com",
                    name: "John Doe",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid input data" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid email or password" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "User logout",
        description:
          "Destroys the current session and clears the session cookie.",
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                },
                example: { success: true },
              },
            },
          },
        },
      },
    },

    // ==================== PROFILE ====================
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get current user profile",
        description: "Returns the authenticated user's profile information.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
                example: {
                  user: {
                    id: "clx1234567890",
                    email: "john.doe@example.com",
                    name: "John Doe",
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update user profile",
        description:
          "Updates the authenticated user's profile. Email uniqueness is validated.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
              example: {
                name: "John Smith",
                email: "john.smith@example.com",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
                example: {
                  user: {
                    id: "clx1234567890",
                    email: "john.smith@example.com",
                    name: "John Smith",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid data or email already taken",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Email already in use" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    },

    // ==================== MEDICATIONS ====================
    "/api/medications": {
      get: {
        tags: ["Medications"],
        summary: "List all medications",
        description:
          "Returns all active (non-deleted) medications for the authenticated user.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "List of medications",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medications: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Medication" },
                    },
                  },
                },
                example: {
                  medications: [
                    {
                      id: "clx1234567890",
                      name: "Aspirin",
                      dose: 500,
                      form: "tablets",
                      createdAt: "2024-01-15T10:30:00.000Z",
                      updatedAt: "2024-01-15T10:30:00.000Z",
                    },
                    {
                      id: "clx0987654321",
                      name: "Vitamin D",
                      dose: 1000,
                      form: "capsules",
                      createdAt: "2024-01-10T08:00:00.000Z",
                      updatedAt: "2024-01-10T08:00:00.000Z",
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Medications"],
        summary: "Create a new medication",
        description:
          "Creates a new medication. Duplicate check is performed on name+dose+form combination.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMedicationRequest" },
              example: {
                name: "Ibuprofen",
                dose: 400,
                form: "tablets",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Medication created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medication: { $ref: "#/components/schemas/Medication" },
                  },
                },
                example: {
                  medication: {
                    id: "clx5555555555",
                    name: "Ibuprofen",
                    dose: 400,
                    form: "tablets",
                    createdAt: "2024-01-20T14:00:00.000Z",
                    updatedAt: "2024-01-20T14:00:00.000Z",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid input data" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Unauthorized" },
              },
            },
          },
          409: {
            description: "Medication already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Medication already exists" },
              },
            },
          },
        },
      },
    },
    "/api/medications/{id}": {
      get: {
        tags: ["Medications"],
        summary: "Get a medication by ID",
        description: "Returns a single medication by its ID.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
            example: "clx1234567890",
          },
        ],
        responses: {
          200: {
            description: "Medication found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medication: { $ref: "#/components/schemas/Medication" },
                  },
                },
                example: {
                  medication: {
                    id: "clx1234567890",
                    name: "Aspirin",
                    dose: 500,
                    form: "tablets",
                    createdAt: "2024-01-15T10:30:00.000Z",
                    updatedAt: "2024-01-15T10:30:00.000Z",
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Medication not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Medication not found" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Medications"],
        summary: "Update a medication",
        description:
          "Updates a medication. If the medication has an active schedule, a new version is created (soft delete old, create new with link). Otherwise, updates in place.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
            example: "clx1234567890",
          },
          {
            name: "tz",
            in: "query",
            description: "Timezone for day status cache update (IANA format)",
            required: false,
            schema: { type: "string", default: "UTC" },
            example: "Europe/Kyiv",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMedicationRequest" },
              examples: {
                simpleUpdate: {
                  summary: "Simple field update",
                  value: {
                    name: "Aspirin Extra",
                    dose: 650,
                  },
                },
                forceVersion: {
                  summary: "Force new version creation",
                  value: {
                    name: "Aspirin Modified",
                    createVersion: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Medication updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MedicationUpdateResponse",
                },
                examples: {
                  simpleUpdate: {
                    summary: "Simple update response",
                    value: {
                      medication: {
                        id: "clx1234567890",
                        name: "Aspirin Extra",
                        dose: 650,
                        form: "tablets",
                        createdAt: "2024-01-15T10:30:00.000Z",
                        updatedAt: "2024-01-20T15:00:00.000Z",
                      },
                      isNewVersion: false,
                    },
                  },
                  versionedUpdate: {
                    summary: "Versioned update response",
                    value: {
                      medication: {
                        id: "clx9999999999",
                        name: "Aspirin Modified",
                        dose: 500,
                        form: "tablets",
                        previousMedicationId: "clx1234567890",
                        createdAt: "2024-01-20T15:00:00.000Z",
                        updatedAt: "2024-01-20T15:00:00.000Z",
                      },
                      isNewVersion: true,
                      previousMedicationId: "clx1234567890",
                      deletedScheduleEntries: 15,
                      generatedScheduleEntries: 15,
                      newScheduleId: "clxsch7777777",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Medication not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Medications"],
        summary: "Delete a medication (soft delete)",
        description:
          "Soft deletes a medication along with related schedules and future schedule entries. Past entries are preserved for history.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
            example: "clx1234567890",
          },
          {
            name: "tz",
            in: "query",
            description: "Timezone for day status cache update",
            required: false,
            schema: { type: "string", default: "UTC" },
            example: "Europe/Kyiv",
          },
        ],
        responses: {
          200: {
            description: "Medication deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    deletedScheduleEntries: { type: "integer" },
                    deletedSchedules: { type: "integer" },
                  },
                },
                example: {
                  message: "Medication deleted successfully",
                  deletedScheduleEntries: 20,
                  deletedSchedules: 1,
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Medication not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/medications/search": {
      post: {
        tags: ["Medications"],
        summary: "Search medications by name",
        description:
          "Searches medications by name prefix (case-insensitive). Minimum 3 characters required.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SearchMedicationRequest" },
              example: {
                name: "Asp",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medications: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Medication" },
                    },
                  },
                },
                example: {
                  medications: [
                    {
                      id: "clx1234567890",
                      name: "Aspirin",
                      dose: 500,
                      form: "tablets",
                      deletedAt: null,
                      createdAt: "2024-01-15T10:30:00.000Z",
                      updatedAt: "2024-01-15T10:30:00.000Z",
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "Invalid input (search query too short)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid input data" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==================== SCHEDULE TEMPLATES ====================
    "/api/schedule/templates": {
      get: {
        tags: ["Schedule"],
        summary: "List all schedule templates",
        description:
          "Returns all active schedule templates for the authenticated user.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "List of schedule templates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScheduleTemplate" },
                    },
                  },
                },
                example: {
                  items: [
                    {
                      id: "clxsch1234567",
                      medicationId: "clx1234567890",
                      userId: "clxuser111111",
                      quantity: 1,
                      units: "pill",
                      frequencyDays: [1, 2, 3, 4, 5],
                      durationDays: 30,
                      dateStart: "2024-01-15T00:00:00.000Z",
                      dateEnd: "2024-02-14T00:00:00.000Z",
                      timeOfDay: ["08:00", "20:00"],
                      mealTiming: "after",
                      createdAt: "2024-01-15T10:30:00.000Z",
                      updatedAt: "2024-01-15T10:30:00.000Z",
                      medication: {
                        id: "clx1234567890",
                        name: "Aspirin",
                        dose: 500,
                        form: "tablets",
                      },
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/schedule/templates/{id}": {
      patch: {
        tags: ["Schedule"],
        summary: "Update a schedule template",
        description:
          "Updates a schedule template. By default, regenerates future schedule entries. Use regenerateEntries: false to skip regeneration.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Schedule template ID",
            required: true,
            schema: { type: "string" },
            example: "clxsch1234567",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateScheduleRequest" },
              example: {
                quantity: 2,
                timeOfDay: ["09:00", "21:00"],
                mealTiming: "before",
                regenerateEntries: true,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Schedule updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schedule: { $ref: "#/components/schemas/ScheduleTemplate" },
                  },
                },
                example: {
                  schedule: {
                    id: "clxsch1234567",
                    medicationId: "clx1234567890",
                    userId: "clxuser111111",
                    quantity: 2,
                    units: "pill",
                    frequencyDays: [1, 2, 3, 4, 5],
                    durationDays: 30,
                    dateStart: "2024-01-15T00:00:00.000Z",
                    dateEnd: "2024-02-14T00:00:00.000Z",
                    timeOfDay: ["09:00", "21:00"],
                    mealTiming: "before",
                    createdAt: "2024-01-15T10:30:00.000Z",
                    updatedAt: "2024-01-20T16:00:00.000Z",
                    medication: {
                      id: "clx1234567890",
                      name: "Aspirin",
                      dose: 500,
                      form: "tablets",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Schedule not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Schedule"],
        summary: "Delete a schedule template (soft delete)",
        description:
          "Soft deletes a schedule template and removes all future PLANNED entries. Past and completed entries are preserved.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Schedule template ID",
            required: true,
            schema: { type: "string" },
            example: "clxsch1234567",
          },
          {
            name: "tz",
            in: "query",
            description: "Timezone for day status cache update",
            required: false,
            schema: { type: "string", default: "UTC" },
            example: "Europe/Kyiv",
          },
        ],
        responses: {
          200: {
            description: "Schedule deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    deletedEntries: { type: "integer" },
                  },
                },
                example: {
                  message: "Schedule deleted successfully",
                  deletedEntries: 15,
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Schedule not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==================== SCHEDULE ENTRIES ====================
    "/api/schedule": {
      get: {
        tags: ["Schedule Entries"],
        summary: "List schedule entries for date range",
        description:
          "Returns all schedule entries within the specified date range. Includes entries from soft-deleted medications/schedules for history.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "from",
            in: "query",
            description: "Start datetime (ISO 8601)",
            required: true,
            schema: { type: "string", format: "date-time" },
            example: "2024-01-15T00:00:00.000Z",
          },
          {
            name: "to",
            in: "query",
            description: "End datetime (ISO 8601)",
            required: true,
            schema: { type: "string", format: "date-time" },
            example: "2024-01-15T23:59:59.999Z",
          },
          {
            name: "tz",
            in: "query",
            description: "Timezone for localDateTime conversion (IANA format)",
            required: false,
            schema: { type: "string", default: "UTC" },
            example: "Europe/Kyiv",
          },
        ],
        responses: {
          200: {
            description: "List of schedule entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScheduleEntry" },
                    },
                  },
                },
                example: {
                  items: [
                    {
                      id: "clxentry11111",
                      medicationId: "clx1234567890",
                      userId: "clxuser111111",
                      status: "PLANNED",
                      utcDateTime: "2024-01-15T08:00:00.000Z",
                      localDateTime: "2024-01-15T10:00:00",
                      quantity: 1,
                      units: "pill",
                      mealTiming: "after",
                      medication: {
                        id: "clx1234567890",
                        name: "Aspirin",
                        dose: 500,
                      },
                      isFromDeletedMedication: false,
                      isFromDeletedSchedule: false,
                    },
                    {
                      id: "clxentry22222",
                      medicationId: "clx1234567890",
                      userId: "clxuser111111",
                      status: "DONE",
                      utcDateTime: "2024-01-15T20:00:00.000Z",
                      localDateTime: "2024-01-15T22:00:00",
                      quantity: 1,
                      units: "pill",
                      mealTiming: "after",
                      medication: {
                        id: "clx1234567890",
                        name: "Aspirin",
                        dose: 500,
                      },
                      isFromDeletedMedication: false,
                      isFromDeletedSchedule: false,
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Schedule"],
        summary: "Create a new schedule",
        description:
          "Creates a new schedule template and generates schedule entries based on the configuration.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateScheduleRequest" },
              example: {
                medicationId: "clx1234567890",
                quantity: 1,
                units: "pill",
                frequencyDays: [1, 2, 3, 4, 5],
                durationDays: 30,
                dateStart: "2024-01-15",
                timeOfDay: ["08:00", "20:00"],
                mealTiming: "after",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Schedule created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schedule: { $ref: "#/components/schemas/ScheduleTemplate" },
                  },
                },
                example: {
                  schedule: {
                    id: "clxsch1234567",
                    medicationId: "clx1234567890",
                    userId: "clxuser111111",
                    quantity: 1,
                    units: "pill",
                    frequencyDays: [1, 2, 3, 4, 5],
                    durationDays: 30,
                    dateStart: "2024-01-15T00:00:00.000Z",
                    dateEnd: "2024-02-14T00:00:00.000Z",
                    timeOfDay: ["08:00", "20:00"],
                    mealTiming: "after",
                    createdAt: "2024-01-15T10:30:00.000Z",
                    updatedAt: "2024-01-15T10:30:00.000Z",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/schedule/{id}": {
      patch: {
        tags: ["Schedule Entries"],
        summary: "Update schedule entry status",
        description: "Marks a schedule entry as DONE or PLANNED.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Schedule entry ID",
            required: true,
            schema: { type: "string" },
            example: "clxentry11111",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateScheduleStatusRequest",
              },
              example: {
                status: "DONE",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    status: { type: "string", enum: ["PLANNED", "DONE"] },
                  },
                },
                example: {
                  id: "clxentry11111",
                  status: "DONE",
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Entry not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Schedule Entries"],
        summary: "Delete a schedule entry",
        description: "Permanently deletes a single schedule entry.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Schedule entry ID",
            required: true,
            schema: { type: "string" },
            example: "clxentry11111",
          },
        ],
        responses: {
          200: {
            description: "Entry deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
                example: {
                  message: "Entry deleted successfully",
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Entry not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/schedule/generate": {
      post: {
        tags: ["Schedule"],
        summary: "Generate schedule entries",
        description:
          "Generates schedule entries for a given schedule template. Used internally after schedule creation/update.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GenerateScheduleRequest" },
              example: {
                scheduleId: "clxsch1234567",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Entries generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    created: { type: "integer" },
                  },
                },
                example: {
                  created: 42,
                },
              },
            },
          },
          400: {
            description: "Invalid input data or deprecated medicationId usage",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: "scheduleId must be provided",
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Schedule not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/schedule/status": {
      get: {
        tags: ["Schedule"],
        summary: "Get day statuses for date range",
        description:
          "Returns aggregated status for each day in the range (ALL_TAKEN, PARTIAL, SCHEDULED, MISSED, NONE).",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "from",
            in: "query",
            description: "Start date (YYYY-MM-DD)",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2024-01-01",
          },
          {
            name: "to",
            in: "query",
            description: "End date (YYYY-MM-DD)",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2024-01-31",
          },
          {
            name: "tz",
            in: "query",
            description: "Timezone (IANA format)",
            required: false,
            schema: { type: "string", default: "UTC" },
            example: "Europe/Kyiv",
          },
        ],
        responses: {
          200: {
            description: "Day statuses",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    statuses: {
                      type: "object",
                      additionalProperties: {
                        type: "string",
                        enum: [
                          "ALL_TAKEN",
                          "PARTIAL",
                          "SCHEDULED",
                          "MISSED",
                          "NONE",
                        ],
                      },
                    },
                  },
                },
                example: {
                  statuses: {
                    "2024-01-15": "ALL_TAKEN",
                    "2024-01-16": "PARTIAL",
                    "2024-01-17": "SCHEDULED",
                    "2024-01-18": "MISSED",
                    "2024-01-19": "NONE",
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==================== EXPORT ====================
    "/api/export/pdf": {
      post: {
        tags: ["Export"],
        summary: "Export schedule to PDF",
        description:
          "Generates a PDF document with schedule entries for the specified date range.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExportPdfRequest" },
              example: {
                userId: "clxuser111111",
                from: "2024-01-01",
                to: "2024-01-31",
                tz: "Europe/Kyiv",
              },
            },
          },
        },
        responses: {
          200: {
            description: "PDF file",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          400: {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden (userId mismatch)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Forbidden" },
              },
            },
          },
          404: {
            description: "No schedule entries found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "No schedule entries for selected dates" },
              },
            },
          },
          422: {
            description: "Invalid date or PDF rendering timeout",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid date range" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session_token",
        description: "HTTP-only session cookie obtained from login/register",
      },
    },
    schemas: {
      // ==================== USER/AUTH ====================
      User: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique user ID (CUID)" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
        },
        required: ["id", "email"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          name: { type: "string", description: "Optional display name" },
        },
        required: ["email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      AuthSuccessResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["user"],
      },

      // ==================== MEDICATION ====================
      Medication: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique medication ID (CUID)" },
          name: { type: "string", maxLength: 150 },
          dose: {
            type: "integer",
            nullable: true,
            description: "Dose amount (e.g., 500 for 500mg)",
          },
          form: {
            type: "string",
            nullable: true,
            description: "Medication form",
            enum: [
              "tablets",
              "capsules",
              "lozenges",
              "candy",
              "drops",
              "ampoule",
              "syringe",
              "packet",
              "sachet",
              "stick",
              "g",
              "mg",
              "ml",
              "dose",
              "teaspoon",
              "tablespoon",
            ],
          },
          previousMedicationId: {
            type: "string",
            nullable: true,
            description: "Link to previous version (for versioned medications)",
          },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "createdAt", "updatedAt"],
      },
      CreateMedicationRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 150 },
          dose: {
            type: "integer",
            minimum: 1,
            description: "Dose amount (positive integer)",
          },
          form: {
            type: "string",
            enum: [
              "tablets",
              "capsules",
              "lozenges",
              "candy",
              "drops",
              "ampoule",
              "syringe",
              "packet",
              "sachet",
              "stick",
              "g",
              "mg",
              "ml",
              "dose",
              "teaspoon",
              "tablespoon",
            ],
          },
        },
        required: ["name"],
      },
      UpdateMedicationRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 150 },
          dose: { type: "integer", minimum: 1 },
          form: {
            type: "string",
            enum: [
              "tablets",
              "capsules",
              "lozenges",
              "candy",
              "drops",
              "ampoule",
              "syringe",
              "packet",
              "sachet",
              "stick",
              "g",
              "mg",
              "ml",
              "dose",
              "teaspoon",
              "tablespoon",
            ],
          },
          createVersion: {
            type: "boolean",
            description:
              "Force creation of a new version instead of in-place update",
          },
        },
      },
      MedicationUpdateResponse: {
        type: "object",
        properties: {
          medication: { $ref: "#/components/schemas/Medication" },
          isNewVersion: { type: "boolean" },
          previousMedicationId: { type: "string", nullable: true },
          deletedScheduleEntries: { type: "integer", nullable: true },
          generatedScheduleEntries: { type: "integer", nullable: true },
          newScheduleId: { type: "string", nullable: true },
        },
        required: ["medication", "isNewVersion"],
      },
      SearchMedicationRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 3,
            maxLength: 150,
            description: "Search query (min 3 chars)",
          },
        },
        required: ["name"],
      },

      // ==================== SCHEDULE ====================
      ScheduleTemplate: {
        type: "object",
        properties: {
          id: { type: "string" },
          medicationId: { type: "string" },
          userId: { type: "string" },
          quantity: { type: "integer", default: 1 },
          units: { type: "string", default: "pill" },
          frequencyDays: {
            type: "array",
            items: { type: "integer", minimum: 1, maximum: 7 },
            description: "Days of week (1=Monday, 7=Sunday)",
          },
          durationDays: {
            type: "integer",
            description: "Duration in days (0 = indefinite)",
          },
          dateStart: { type: "string", format: "date-time" },
          dateEnd: { type: "string", format: "date-time", nullable: true },
          timeOfDay: {
            type: "array",
            items: {
              type: "string",
              pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
            },
            description: "Times in HH:MM format",
          },
          mealTiming: {
            type: "string",
            enum: ["before", "with", "after", "anytime"],
            default: "anytime",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          medication: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              dose: { type: "integer", nullable: true },
              form: { type: "string", nullable: true },
            },
          },
        },
        required: [
          "id",
          "medicationId",
          "userId",
          "quantity",
          "units",
          "frequencyDays",
          "durationDays",
          "dateStart",
          "timeOfDay",
          "mealTiming",
        ],
      },
      CreateScheduleRequest: {
        type: "object",
        properties: {
          medicationId: { type: "string", minLength: 1 },
          quantity: { type: "integer", minimum: 1, default: 1 },
          units: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            default: "pill",
          },
          frequencyDays: {
            type: "array",
            items: { type: "integer", minimum: 1, maximum: 7 },
            minItems: 1,
            description: "Days of week (1=Mon...7=Sun)",
          },
          durationDays: { type: "integer", minimum: 0, maximum: 365 },
          dateStart: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "YYYY-MM-DD",
          },
          timeOfDay: {
            type: "array",
            items: {
              type: "string",
              pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
            },
            minItems: 1,
            description: "HH:MM format",
          },
          mealTiming: {
            type: "string",
            enum: ["before", "with", "after", "anytime"],
            default: "anytime",
          },
        },
        required: [
          "medicationId",
          "frequencyDays",
          "durationDays",
          "dateStart",
          "timeOfDay",
        ],
      },
      UpdateScheduleRequest: {
        type: "object",
        properties: {
          quantity: { type: "integer", minimum: 1 },
          units: { type: "string", minLength: 1, maxLength: 50 },
          frequencyDays: {
            type: "array",
            items: { type: "integer", minimum: 1, maximum: 7 },
            minItems: 1,
          },
          durationDays: { type: "integer", minimum: 0, maximum: 365 },
          dateStart: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          timeOfDay: {
            type: "array",
            items: {
              type: "string",
              pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
            },
            minItems: 1,
          },
          mealTiming: {
            type: "string",
            enum: ["before", "with", "after", "anytime"],
          },
          regenerateEntries: {
            type: "boolean",
            default: true,
            description:
              "If true, regenerates future schedule entries after update",
          },
        },
        description: "At least one field must be provided",
      },
      ScheduleEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          medicationId: { type: "string", nullable: true },
          userId: { type: "string" },
          status: { type: "string", enum: ["PLANNED", "DONE"] },
          utcDateTime: { type: "string", format: "date-time" },
          localDateTime: {
            type: "string",
            description: "Local time in requested timezone",
          },
          quantity: { type: "integer", nullable: true },
          units: { type: "string", nullable: true },
          mealTiming: { type: "string", nullable: true },
          medication: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              dose: { type: "integer", nullable: true },
            },
          },
          isFromDeletedMedication: {
            type: "boolean",
            description: "True if medication was soft-deleted",
          },
          isFromDeletedSchedule: {
            type: "boolean",
            description: "True if schedule was soft-deleted",
          },
        },
        required: ["id", "userId", "status", "utcDateTime", "localDateTime"],
      },
      UpdateScheduleStatusRequest: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["PLANNED", "DONE"] },
        },
        required: ["status"],
      },
      GenerateScheduleRequest: {
        type: "object",
        properties: {
          scheduleId: { type: "string", description: "Schedule template ID" },
          medicationId: {
            type: "string",
            description: "DEPRECATED: Use scheduleId instead",
          },
        },
        description: "scheduleId is required. medicationId is deprecated.",
      },

      // ==================== EXPORT ====================
      ExportPdfRequest: {
        type: "object",
        properties: {
          userId: { type: "string", minLength: 1 },
          from: {
            type: "string",
            description: "Start date (YYYY-MM-DD or ISO string)",
          },
          to: {
            type: "string",
            description: "End date (YYYY-MM-DD or ISO string)",
          },
          tz: { type: "string", default: "UTC", description: "IANA timezone" },
        },
        required: ["userId", "from", "to"],
      },

      // ==================== COMMON ====================
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: {
            type: "object",
            description:
              "Additional error details (e.g., field-level validation errors)",
          },
        },
        required: ["error"],
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
