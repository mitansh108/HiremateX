// Environment variable validation
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue
  if (!value) {
    console.warn(`Environment variable ${name} is not set`)
    return ''
  }
  return value
}

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'