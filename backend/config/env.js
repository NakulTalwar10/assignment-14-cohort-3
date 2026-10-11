const REQUIRED_ENV_VARIABLES = ["MONGO_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]
const SAME_SITE_VALUES = ["strict", "lax", "none"]

export const assertRequiredEnv = () => {
    const missingVariables = REQUIRED_ENV_VARIABLES.filter((name) => !process.env[name])

    if (missingVariables.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`)
    }

    if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different")
    }

    if (process.env.COOKIE_SAME_SITE && !SAME_SITE_VALUES.includes(process.env.COOKIE_SAME_SITE)) {
        throw new Error("COOKIE_SAME_SITE must be strict, lax, or none")
    }
}

export const getAllowedOrigins = () => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    return clientUrl.split(",").map((origin) => origin.trim().replace(/\/+$/, ""))
}
