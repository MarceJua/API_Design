import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { db } from '../db/connection.ts'
import { habits, entries, habitTags, tags } from '../db/schema.ts'
import { eq, and, desc, inArray, gte, lt } from 'drizzle-orm'

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body
    const userId = req.user!.id

    // Start a transaction for data consistency
    const result = await db.transaction(async (tx) => {
      // Create the habit
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          name,
          description,
          frequency,
          targetCount,
        })
        .returning()

      // If tags are provided, create the associations
      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: string) => ({
          habitId: newHabit.id,
          tagId,
        }))
        await tx.insert(habitTags).values(habitTagValues)
      }

      return newHabit
    })

    res.status(201).json({
      message: 'Habit created successfully',
      habit: result,
    })
  } catch (error) {
    console.error('Create habit error:', error)
    res.status(500).json({ error: 'Failed to create habit' })
  }
}

export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id

    // Query habits with their tags using relations
    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.createdAt)],
    })

    // Transform the data to include tags directly
    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined, // Remove intermediate relation
    }))

    res.json({
      habits: habitsWithTags,
    })
  } catch (error) {
    console.error('Get habits error:', error)
    res.status(500).json({ error: 'Failed to fetch habits' })
  }
}

export const updateHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      // Update the habit
      const [updatedHabit] = await tx
        .update(habits)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(habits.id, id), eq(habits.userId, userId)))
        .returning()

      if (!updatedHabit) {
        throw new Error('Habit not found')
      }

      // If tagIds are provided, update the associations
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.delete(habitTags).where(eq(habitTags.habitId, id))

        // Add new tags
        if (tagIds.length > 0) {
          const habitTagValues = tagIds.map((tagId: string) => ({
            habitId: id,
            tagId,
          }))
          await tx.insert(habitTags).values(habitTagValues)
        }
      }

      return updatedHabit
    })

    res.json({
      message: 'Habit updated successfully',
      habit: result,
    })
  } catch (error: any) {
    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' })
    }
    console.error('Update habit error:', error)
    res.status(500).json({ error: 'Failed to update habit' })
  }
}

export const deleteHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const [deletedHabit] = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning()

    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    res.json({
      message: 'Habit deleted successfully',
    })
  } catch (error) {
    console.error('Delete habit error:', error)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
}

export const getHabitById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, id), eq(habits.userId, userId)),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
        entries: {
          orderBy: [desc(entries.completionDate)],
          limit: 10, // Recent entries only
        },
      },
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    // Transform the data
    const habitWithTags = {
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }

    res.json({
      habit: habitWithTags,
    })
  } catch (error) {
    console.error('Get habit error:', error)
    res.status(500).json({ error: 'Failed to fetch habit' })
  }
}
// 1. Marcar un hábito como completado
export const completeHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: habitId } = req.params
    const userId = req.user!.id
    const { note } = req.body

    // a. Verificar que el hábito existe y pertenece al usuario
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    // b. Regla de negocio: Solo 1 vez por día (Basado en tus API_DOCS)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingEntry = await db.query.entries.findFirst({
      where: and(
        eq(entries.habitId, habitId),
        gte(entries.completionDate, today),
        lt(entries.completionDate, tomorrow)
      ),
    })

    if (existingEntry) {
      return res.status(409).json({ 
        error: 'Habit already completed today',
        message: 'You can only complete a habit once per day'
      })
    }

    // c. Insertar la nueva entrada
    const [newEntry] = await db
      .insert(entries)
      .values({
        habitId,
        note,
      })
      .returning()

    res.status(201).json({
      message: 'Habit completed successfully',
      entry: newEntry,
    })
  } catch (error) {
    console.error('Complete habit error:', error)
    res.status(500).json({ error: 'Failed to complete habit' })
  }
}

// 2. Obtener hábitos filtrados por un Tag específico
export const getHabitsByTag = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tagId } = req.params
    const userId = req.user!.id

    // Buscamos en la tabla pivote (habitTags) pero filtrando por el usuario dueño del hábito
    const relations = await db.query.habitTags.findMany({
      where: eq(habitTags.tagId, tagId),
      with: {
        habit: {
          with: {
            habitTags: {
              with: { tag: true }
            }
          }
        }
      }
    })

    // Filtramos para asegurar que solo devuelva los hábitos del usuario actual
    const userHabits = relations
      .filter((ht) => ht.habit.userId === userId)
      .map((ht) => ({
        ...ht.habit,
        tags: ht.habit.habitTags.map((innerHt) => innerHt.tag),
        habitTags: undefined, // Limpiamos la respuesta
      }))

    res.json({ habits: userHabits })
  } catch (error) {
    console.error('Get habits by tag error:', error)
    res.status(500).json({ error: 'Failed to fetch habits for this tag' })
  }
}

// 3. Agregar etiquetas a un hábito existente
export const addTagsToHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: habitId } = req.params
    const { tagIds } = req.body
    const userId = req.user!.id

    // Verificar propiedad del hábito
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    })

    if (!habit) return res.status(404).json({ error: 'Habit not found' })

    // Insertar evitando duplicados exactos (revisamos cuáles ya existen)
    const existingRelations = await db.query.habitTags.findMany({
      where: and(eq(habitTags.habitId, habitId), inArray(habitTags.tagId, tagIds)),
    })
    
    const existingTagIds = existingRelations.map(r => r.tagId)
    const newTagIds = tagIds.filter((id: string) => !existingTagIds.includes(id))

    if (newTagIds.length > 0) {
      const valuesToInsert = newTagIds.map((tagId: string) => ({
        habitId,
        tagId,
      }))
      await db.insert(habitTags).values(valuesToInsert)
    }

    res.status(201).json({ message: 'Tags added successfully' })
  } catch (error) {
    console.error('Add tags error:', error)
    res.status(500).json({ error: 'Failed to add tags to habit' })
  }
}

// 4. Remover un tag específico de un hábito
export const removeTagFromHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: habitId, tagId } = req.params
    const userId = req.user!.id

    // Transacción para verificar propiedad antes de borrar
    await db.transaction(async (tx) => {
      const habit = await tx.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
      })

      if (!habit) throw new Error('Habit not found')

      await tx.delete(habitTags)
        .where(and(eq(habitTags.habitId, habitId), eq(habitTags.tagId, tagId)))
    })

    res.json({ message: 'Tag removed from habit successfully' })
  } catch (error: any) {
    if (error.message === 'Habit not found') return res.status(404).json({ error: error.message })
    console.error('Remove tag error:', error)
    res.status(500).json({ error: 'Failed to remove tag' })
  }
}

// Nota: He omitido `logHabitCompletion` porque en tu diseño de rutas (`habitRoutes.ts`) 
// la ruta POST '/:id/complete' llama a `completeHabit`. Ambas hacen lo mismo, así que 
// puedes borrar `logHabitCompletion` de tu código para evitar duplicados.