export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GoIT Capstone API",
    version: "1.0.0",
    description:
      "OpenAPI specification for authentication, profile, and sessions in the Next.js application.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  tags: [
    { name: "Auth", description: "Authentication" },
    { name: "Profile", description: "User profile" },
    { name: "Medications", description: "Medication management" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
              },
            },
          },
          409: {
            description: "Email already in use",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          400: {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Success",
            headers: {
              "Set-Cookie": {
                description: "HTTP-only session cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get current profile (requires session)",
        responses: {
          200: {
            description: "Profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          401: {
            description: "No session",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update profile (requires session)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          400: {
            description: "Invalid data or email taken",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "No session",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/medications": {
      get: {
        tags: ["Medications"],
        summary: "Get all medications for the authenticated user",
        parameters: [
          {
            name: "status",
            in: "query",
            description:
              "Filter by medication status (ACTIVE or DELETED). Defaults to ACTIVE.",
            required: false,
            schema: {
              type: "string",
              enum: ["ACTIVE", "DELETED"],
            },
          },
        ],
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
        tags: ["Medications"],
        summary: "Create a new medication",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMedicationRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Medication created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medication: { $ref: "#/components/schemas/Medication" },
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
    "/api/medications/{id}": {
      get: {
        tags: ["Medications"],
        summary: "Get a single medication by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Medication details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medication: { $ref: "#/components/schemas/Medication" },
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
              },
            },
          },
        },
      },
      patch: {
        tags: ["Medications"],
        summary: "Update a medication by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMedicationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Medication updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medication: { $ref: "#/components/schemas/Medication" },
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
        summary: "Soft delete a medication by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Medication ID",
            required: true,
            schema: { type: "string" },
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
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
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
          name: { type: "string" },
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
        additionalProperties: false,
      },
      AuthSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["user"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          status: { type: "integer" },
        },
      },
      Medication: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          dose: { type: "string" },
          frequency: { type: "integer", description: "Hours between doses" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["ACTIVE", "DELETED"],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "name",
          "dose",
          "frequency",
          "startDate",
          "endDate",
          "status",
        ],
      },
      CreateMedicationRequest: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 150 },
          dose: { type: "string", maxLength: 100 },
          frequency: { type: "integer", minimum: 1 },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
        },
        required: ["name", "dose", "frequency", "startDate", "endDate"],
      },
      UpdateMedicationRequest: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 150 },
          dose: { type: "string", maxLength: 100 },
          frequency: { type: "integer", minimum: 1 },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
        },
        additionalProperties: false,
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
