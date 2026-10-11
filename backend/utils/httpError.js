export const createError = (message, statusCode, errors) => {
    const error = new Error(message)
    error.statusCode = statusCode

    if (errors) {
        error.errors = errors
    }

    return error
}
