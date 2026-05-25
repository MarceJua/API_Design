import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    integer
} from 'drizzle-orm/pg-core'
import { name, relations } from 'drizzle-orm'
import fi from 'zod/v4/locales/fi.cjs';
import { ta } from 'zod/v4/locales/index.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'


// Users table - core authentication and profile
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),

    firstName: varchar('first_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Habits table - core habit definitions
export const habits = pgTable('habits', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    frequency: varchar('frequency', { length: 20 }).notNull(),
    targetCount: integer('target_count').default(1),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Habit entries - individual completions
export const entries = pgTable('entries', {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id').notNull().references(() => habits.id, {onDelete: 'cascade'}),
    completionDate: timestamp('completion_date').notNull().defaultNow(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tags table - categorization system
export const tags = pgTable('tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    color: varchar('color', { length: 20 }).default('blue'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Junction table for many-to-many relationship
export const habitTags = pgTable('habit_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .references(() => habits.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Users can have many habits
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
}))

// Habits belong to one user, have many entries and tags
export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  entries: many(entries),
  habitTags: many(habitTags),
}))

// Entries belong to one habit
export const entriesRelations = relations(entries, ({ one }) => ({
  habit: one(habits, {
    fields: [entries.habitId],
    references: [habits.id],
  }),
}))

// Tags can be on many habits
export const tagsRelations = relations(tags, ({ many }) => ({
  habitTags: many(habitTags),
}))

// Junction table relations
export const habitTagsRelations = relations(habitTags, ({ one }) => ({
  habit: one(habits, {
    fields: [habitTags.habitId],
    references: [habits.id],
  }),
  tag: one(tags, {
    fields: [habitTags.tagId],
    references: [tags.id],
  }),
}))



// -- TypeScript Integration
// Infer types from schema
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
  
export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert


// -- Zod Integration
// Auto-generate Zod schemas from Drizzle tables
export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

/*
// Customize validation
export const createUserSchema = insertUserSchema.extend({
  email: z.string().email(),
  password: z.string().min(8),
})

// Use in API validation
app.post('/users', validateBody(createUserSchema), async (req, res) => {
  // req.body is fully typed and validated
  const user = await createUser(req.body)
  res.json(user)
})

// -- Using Relations in Queries
// Get user with all their habits and tags
const userWithData = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    habits: {
      with: {
        entries: true,
        habitTags: {
          with: {
            tag: true
          }
        }
      }
    }
  }
})

// Result has perfect TypeScript types:
user.habits[0].entries[0].note           // ✅ string | null
user.habits[0].habitTags[0].tag.color    // ✅ string

// Usage in functions
const createUser = async (userData: NewUser): Promise<User> => {
  const [user] = await db.insert(users).values(userData).returning()
  return user
}
  */