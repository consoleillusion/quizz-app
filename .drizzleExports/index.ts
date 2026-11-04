import {tables} from '../experimental/generate-migration.ts'

export const Tag = tables['Tag'].drizzleSchema
export const Article = tables['Article'].drizzleSchema
export const Key = tables['Key'].drizzleSchema
export const Schema = tables['Schema'].drizzleSchema
export const User = tables['User'].drizzleSchema
export const Group = tables['Group'].drizzleSchema